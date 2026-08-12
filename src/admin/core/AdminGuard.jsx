// AdminGuard is an experience guard, not a security boundary. The Worker and requireAdmin
// authorize every operation; this component prevents admin UI flicker and explains state.
import Card from "../../core/ui/Card";
import Button from "../../core/ui/Button";
import Icon from "../../core/ui/Icon";
import Skeleton from "../../core/ui/Skeleton";
import { ACID, RED } from "../../tokens";

export default function AdminGuard({ auth, children, accentColor = ACID, deniedMessage = "Esta terminal requiere sesión de administrador.", onRetry = null }) {
  const current = auth ?? { isLoading: true, isAdmin: false, user: null };
  if (current.isLoading) return (
    <Card accentColor={accentColor} style={{ minHeight: 180, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
      <div className="flex items-center gap-2" style={{ color: accentColor, fontSize: 11, letterSpacing: "0.2em" }}><Icon name="shield" size={18} decorative />VERIFICANDO CREDENCIALES</div>
      <Skeleton.Text lines={2} />
    </Card>
  );
  if (!current.isAdmin) return (
    <Card accentColor={RED} style={{ minHeight: 180, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
      <div className="flex items-center gap-2" style={{ color: RED, fontSize: 12, letterSpacing: "0.2em" }}><Icon name="shield" size={20} decorative />ACCESO DENEGADO</div>
      <p className="text-xs leading-relaxed" style={{ color: `${RED}bb` }}>{deniedMessage}</p>
      {onRetry && <Button size="sm" accentColor={RED} icon={<Icon name="refresh" size={13} decorative />} onClick={onRetry}>REINTENTAR</Button>}
    </Card>
  );
  return children;
}
