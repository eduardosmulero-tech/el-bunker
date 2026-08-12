#!/usr/bin/env python3
# tools/backfill_blurhash/blurhash.py
# Port 1:1 del encode oficial de blurhash (woltapp/blurhash, TypeScript/src/encode.ts
# + base83.ts + utils.ts, master 2026-08-12). Referencias descargadas en este mismo
# directorio (*_referencia.ts). La aritmetica replicate JS float64: los operadores
# JS (%, <<, Math.trunc, Math.floor, Math.round ausente) se traducen uno a uno.
#
# Por que existe: el backfill A6 necesita calcular blurhash localmente sin ninguna
# dependencia nueva (PIL ya esta en el entorno). El port se verifica contra la
# implementacion oficial ejecutandola con node (test/verifica_ports.py).

import math

DIGIT_CHARACTERS = (
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~"
)


def encode83(n: int, length: int) -> str:
    result = ""
    for i in range(1, length + 1):
        digit = (math.floor(n) / (83 ** (length - i))) % 83
        result += DIGIT_CHARACTERS[math.floor(digit)]
    return result


def s_rgb_to_linear(value: int) -> float:
    v = value / 255.0
    if v <= 0.04045:
        return v / 12.92
    return ((v + 0.055) / 1.055) ** 2.4


def linear_to_s_rgb(value: float) -> int:
    v = max(0.0, min(1.0, value))
    if v <= 0.0031308:
        return math.trunc(v * 12.92 * 255 + 0.5)
    return math.trunc((1.055 * (v ** (1 / 2.4)) - 0.055) * 255 + 0.5)


def sign(n: float) -> float:
    return -1.0 if n < 0 else 1.0


def sign_pow(val: float, exp: float) -> float:
    return sign(val) * (abs(val) ** exp)


def _multiply_basis_function(pixels, width: int, height: int, basis_function):
    r = 0.0
    g = 0.0
    b = 0.0
    bytes_per_row = width * 4
    for x in range(width):
        bytes_per_pixel_x = 4 * x
        for y in range(height):
            base_pixel_index = bytes_per_pixel_x + y * bytes_per_row
            basis = basis_function(x, y)
            r += basis * s_rgb_to_linear(pixels[base_pixel_index])
            g += basis * s_rgb_to_linear(pixels[base_pixel_index + 1])
            b += basis * s_rgb_to_linear(pixels[base_pixel_index + 2])
    scale = 1.0 / (width * height)
    return [r * scale, g * scale, b * scale]


def _encode_dc(value) -> int:
    rounded_r = linear_to_s_rgb(value[0])
    rounded_g = linear_to_s_rgb(value[1])
    rounded_b = linear_to_s_rgb(value[2])
    return (rounded_r << 16) + (rounded_g << 8) + rounded_b


def _encode_ac(value, maximum_value: float) -> int:
    quant_r = math.floor(
        max(0, min(18, math.floor(sign_pow(value[0] / maximum_value, 0.5) * 9 + 9.5)))
    )
    quant_g = math.floor(
        max(0, min(18, math.floor(sign_pow(value[1] / maximum_value, 0.5) * 9 + 9.5)))
    )
    quant_b = math.floor(
        max(0, min(18, math.floor(sign_pow(value[2] / maximum_value, 0.5) * 9 + 9.5)))
    )
    return quant_r * 19 * 19 + quant_g * 19 + quant_b


def encode(pixels, width: int, height: int, component_x: int, component_y: int) -> str:
    """pixels: secuencia RGBA (int 0-255) en orden fila-mayor, length == width*height*4."""
    if component_x < 1 or component_x > 9 or component_y < 1 or component_y > 9:
        raise ValueError("BlurHash must have between 1 and 9 components")
    if width * height * 4 != len(pixels):
        raise ValueError("Width and height must match the pixels array")

    factors = []
    for y in range(component_y):
        for x in range(component_x):
            normalisation = 1 if (x == 0 and y == 0) else 2
            factor = _multiply_basis_function(
                pixels,
                width,
                height,
                lambda i, j, x=x, y=y: normalisation
                * math.cos((math.pi * x * i) / width)
                * math.cos((math.pi * y * j) / height),
            )
            factors.append(factor)

    dc = factors[0]
    ac = factors[1:]

    hash_str = ""
    size_flag = component_x - 1 + (component_y - 1) * 9
    hash_str += encode83(size_flag, 1)

    if len(ac) > 0:
        actual_maximum_value = max(max(v) for v in ac)
        quantised_maximum_value = math.floor(
            max(0, min(82, math.floor(actual_maximum_value * 166 - 0.5)))
        )
        maximum_value = (quantised_maximum_value + 1) / 166
        hash_str += encode83(quantised_maximum_value, 1)
    else:
        maximum_value = 1.0
        hash_str += encode83(0, 1)

    hash_str += encode83(_encode_dc(dc), 4)

    for factor in ac:
        hash_str += encode83(_encode_ac(factor, maximum_value), 2)

    return hash_str