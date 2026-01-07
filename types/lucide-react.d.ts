declare module "lucide-react" {
  import type { FC, SVGProps } from "react";

  export type LucideIcon = FC<SVGProps<SVGSVGElement>>;

  // Fallback typing so the bundler-provided definitions are recognised during type checking
  export const icons: Record<string, LucideIcon>;
  export default icons;

  // Allow named imports to resolve without emitting type errors
  export const Search: LucideIcon;
  export const Eye: LucideIcon;
  export const Plus: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Users: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const FileQuestion: LucideIcon;
  export const FileText: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const LogOut: LucideIcon;
  export const Menu: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Edit: LucideIcon;
  export const Calendar: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const FolderOpen: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Download: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Bell: LucideIcon;
  export const User: LucideIcon;
  export const Loader2: LucideIcon;
  export const Check: LucideIcon;
  export const CheckIcon: LucideIcon;
  export const ChevronDownIcon: LucideIcon;
  export const ChevronUpIcon: LucideIcon;
  export const X: LucideIcon;
  export const XIcon: LucideIcon;
  export const Circle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const EyeOff: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Video: LucideIcon;
  export const Play: LucideIcon;
  export const Star: LucideIcon;
  export const Send: LucideIcon;
  export const Trash2: LucideIcon;
}
