// Design system — mọi UI trong app import từ đây.
// Tầng primitive (file trong thư mục này) là nơi duy nhất chứa tag HTML thô.
export { AmbientBackground } from "@/components/ui/AmbientBackground";
export { Alert } from "@/components/ui/Alert";
export { Avatar } from "@/components/ui/Avatar";
export { Badge, StatusDot, badgeVariants } from "@/components/ui/Badge";
export { Button, buttonVariants } from "@/components/ui/Button";
export type { ButtonProps } from "@/components/ui/Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
export { Spinner, LoadingState, EmptyState } from "@/components/ui/Feedback";
export { Form, Field, FieldLabel, FieldError, FieldHint, PasswordChecklist } from "@/components/ui/Field";
export type { PasswordRule } from "@/components/ui/Field";
export { Input, Select } from "@/components/ui/Input";
export type { InputProps, SelectOption, SelectProps } from "@/components/ui/Input";
export { PasswordInput } from "@/components/ui/PasswordInput";
export type { PasswordInputProps } from "@/components/ui/PasswordInput";
export {
  Box,
  Stack,
  Inline,
  Center,
  Container,
  Grid,
  Divider,
  PageShell,
  AuthShell,
  PageHeader,
} from "@/components/ui/Layout";
export { Pagination } from "@/components/ui/Pagination";
export {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  ColumnHeader,
  TableCell,
  TableStateRow,
  TableLink,
} from "@/components/ui/Table";
export { Heading, Text, FormLabel } from "@/components/ui/Typography";
export {
  AuthHeader,
  AuthCard,
  AuthFooter,
  AuthIconBadge,
  AdminShell,
  AdminBrand,
  SidebarLink,
  AdminActionRow,
} from "@/components/ui/Admin";
export type { AdminNavItem } from "@/components/ui/Admin";
