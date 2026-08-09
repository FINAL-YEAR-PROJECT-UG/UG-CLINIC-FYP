/**
 * Centralized Heroicons exports for consistent iconography across the app.
 * Uses @heroicons/react (24px outline) — same design system as Assets/Heroicons (Community).
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowTrendingUpIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BeakerIcon,
  BellIcon,
  BoltIcon,
  BookmarkIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  FaceSmileIcon,
  FilmIcon,
  FlagIcon,
  GiftIcon,
  HandRaisedIcon,
  HeartIcon,
  HomeIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MapPinIcon,
  MinusIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PhoneIcon,
  PlayCircleIcon,
  PlusIcon,
  PrinterIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  SunIcon,
  TrashIcon,
  TrophyIcon,
  UserIcon,
  UserMinusIcon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type IconProps = React.ComponentProps<'svg'> & {
  title?: string;
  titleId?: string;
};

export type IconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<IconProps> & React.RefAttributes<SVGSVGElement>
>;

/** Spinning loader — replaces Lucide Loader2 */
export function Loader2({ className, ...props }: IconProps) {
  return (
    <ArrowPathIcon
      aria-hidden={props['aria-label'] ? undefined : true}
      className={cn('animate-spin', className)}
      {...props}
    />
  );
}

// ── Lucide-compatible aliases ────────────────────────────────────────────────

export const Home = HomeIcon;
export const Info = InformationCircleIcon;
export const CalendarDays = CalendarDaysIcon;
export const BookOpen = BookOpenIcon;
export const Phone = PhoneIcon;
export const Menu = Bars3Icon;
export const X = XMarkIcon;
export const Activity = ChartBarIcon;
export const Calendar = CalendarIcon;
export const Users = UsersIcon;
export const FileText = DocumentTextIcon;
export const Settings = Cog6ToothIcon;
export const Stethoscope = ClipboardDocumentCheckIcon;
export const Brain = SparklesIcon;
export const HeartPulse = HeartIcon;
export const Syringe = ShieldCheckIcon;
export const Pill = BeakerIcon;
export const Apple = SunIcon;
export const ChevronRight = ChevronRightIcon;
export const CheckCircle2 = CheckCircleIcon;
export const ArrowRight = ArrowRightIcon;
export const Award = TrophyIcon;
export const Clock = ClockIcon;
export const Building2 = BuildingOffice2Icon;
export const ShieldCheck = ShieldCheckIcon;
export const Target = FlagIcon;
export const Eye = EyeIcon;
export const MapPin = MapPinIcon;
export const Mail = EnvelopeIcon;
export const ChevronDown = ChevronDownIcon;
export const Navigation = MapIcon;
export const Copy = DocumentDuplicateIcon;
export const AlertTriangle = ExclamationTriangleIcon;
export const Send = PaperAirplaneIcon;
export const Ribbon = GiftIcon;
export const Smile = FaceSmileIcon;
export const Search = MagnifyingGlassIcon;
export const PlayCircle = PlayCircleIcon;
export const Download = ArrowDownTrayIcon;
export const Bookmark = BookmarkIcon;
export const HandHeart = HandRaisedIcon;
export const UploadCloud = CloudArrowUpIcon;
export const Plus = PlusIcon;
export const ShieldAlert = ShieldExclamationIcon;
export const Heart = HeartIcon;
export const ClipboardList = ClipboardDocumentListIcon;
export const Sparkles = SparklesIcon;
export const UserCheck = CheckBadgeIcon;
export const Bot = CpuChipIcon;
export const CalendarClock = CalendarDaysIcon;
export const Layers3 = Square3Stack3DIcon;
export const Lock = LockClosedIcon;
export const LogOut = ArrowRightOnRectangleIcon;
export const Minus = MinusIcon;
export const RefreshCw = ArrowPathIcon;
export const Unlock = LockOpenIcon;
export const Wand2 = SparklesIcon;
export const Zap = BoltIcon;
export const XCircle = XCircleIcon;
export const TrendingUp = ArrowTrendingUpIcon;
export const GraduationCap = AcademicCapIcon;
export const UserX = UserMinusIcon;
export const KeyRound = KeyIcon;
export const ArrowLeft = ArrowLeftIcon;
export const EyeOff = EyeSlashIcon;
export const Trash2 = TrashIcon;
export const Shield = ShieldCheckIcon;
export const Bell = BellIcon;
export const Smartphone = DevicePhoneMobileIcon;
export const User = UserIcon;
export const Film = FilmIcon;
export const Upload = ArrowUpTrayIcon;
export const Pencil = PencilIcon;
export const Leaf = SunIcon;
export const Check = CheckIcon;
export const Printer = PrinterIcon;
export const AlertCircle = ExclamationCircleIcon;
export const MessageCircle = ChatBubbleLeftRightIcon;
export const ChevronLeft = ChevronLeftIcon;
export const ExternalLink = ArrowTopRightOnSquareIcon;

// UI component aliases (Lucide naming)
export const XIcon = XMarkIcon;
export const CircleCheckIcon = CheckCircleIcon;
export const InfoIcon = InformationCircleIcon;
export const TriangleAlertIcon = ExclamationTriangleIcon;
export const OctagonXIcon = XCircleIcon;
export const Loader2Icon = Loader2;

export {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
};
