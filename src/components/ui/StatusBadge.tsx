import Badge from './Badge'
import {
  CATALOG_STATUS_BADGE,
  CATALOG_STATUS_LABELS,
  REVIEW_STATUS_BADGE,
  REVIEW_STATUS_LABELS,
  SUPPORT_STATUS_BADGE,
  SUPPORT_STATUS_LABELS,
  type CatalogStatus,
  type ReviewStatus,
  type SupportStatus,
} from '../../constants/enums'

/** Colored badge for a catalog status (Draft / Published / …). */
export function CatalogStatusBadge({ status }: { status: CatalogStatus }) {
  return <Badge variant={CATALOG_STATUS_BADGE[status]}>{CATALOG_STATUS_LABELS[status]}</Badge>
}

/** Colored badge for a review status (Pending / Approved / Rejected). */
export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge variant={REVIEW_STATUS_BADGE[status]}>{REVIEW_STATUS_LABELS[status]}</Badge>
}

/** Active / Inactive badge for on/off records. */
export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Inactive'}</Badge>
}

/** Colored badge for a support ticket (Open / In progress / Resolved / Closed). */
export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  return <Badge variant={SUPPORT_STATUS_BADGE[status]}>{SUPPORT_STATUS_LABELS[status]}</Badge>
}
