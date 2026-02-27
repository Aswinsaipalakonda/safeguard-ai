"""
Report generation service for SafeGuard AI.
Produces Daily Compliance, DGMS Inspection, and ESG Quarterly PDF reports.
Falls back to JSON summaries if ReportLab is not installed.
"""

import io
import os
import json
import logging
from datetime import date, timedelta, datetime
from pathlib import Path

from django.utils import timezone
from django.db.models import Count, Avg, Q, F
from django.db.models.functions import TruncDate

logger = logging.getLogger(__name__)

# Lazy imports for optional heavy dependencies
_reportlab_available = False
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    )
    _reportlab_available = True
except ImportError:
    logger.info("ReportLab not installed – PDF generation disabled, using JSON fallback.")

_openpyxl_available = False
try:
    import openpyxl
    _openpyxl_available = True
except ImportError:
    logger.info("openpyxl not installed – Excel export disabled.")


def _get_models():
    """Lazy import Django models to avoid AppRegistryNotReady."""
    from api.models import Site, Zone, Worker, Violation, Alert, ComplianceReport
    return Site, Zone, Worker, Violation, Alert, ComplianceReport


class ReportService:
    """Generates compliance reports in PDF / Excel / JSON."""

    REPORT_DIR = Path(__file__).resolve().parent.parent / "report_output"

    def __init__(self):
        self.REPORT_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Daily Compliance Report
    # ------------------------------------------------------------------
    def generate_daily_report(self, site=None, target_date=None):
        """Generate a daily compliance report for a given site and date."""
        Site, Zone, Worker, Violation, Alert, ComplianceReport = _get_models()
        target_date = target_date or date.today()
        day_start = datetime.combine(target_date, datetime.min.time())
        day_end = datetime.combine(target_date, datetime.max.time())

        violations_qs = Violation.objects.filter(
            created_at__range=(day_start, day_end)
        )

        total_violations = violations_qs.count()
        resolved = violations_qs.filter(resolved_at__isnull=False).count()
        by_ppe = list(
            violations_qs.values('ppe_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        by_zone = list(
            violations_qs.values('zone')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        avg_confidence = violations_qs.aggregate(avg=Avg('confidence'))['avg'] or 0

        active_workers = Worker.objects.filter(is_active=True).count()
        compliance_rate = round(
            (1 - total_violations / max(total_violations + active_workers, 1)) * 100, 1
        )

        data = {
            "report_type": "daily_compliance",
            "date": str(target_date),
            "site": site.name if site else "All Sites",
            "total_violations": total_violations,
            "resolved_violations": resolved,
            "compliance_rate": compliance_rate,
            "avg_confidence": round(avg_confidence, 2),
            "by_ppe_type": by_ppe,
            "by_zone": by_zone,
            "active_workers": active_workers,
        }

        # Try PDF generation
        if _reportlab_available:
            filename = f"daily_report_{target_date}.pdf"
            filepath = self.REPORT_DIR / filename
            self._build_daily_pdf(data, filepath)
            data["file_path"] = str(filepath)
            data["format"] = "pdf"
        else:
            filename = f"daily_report_{target_date}.json"
            filepath = self.REPORT_DIR / filename
            filepath.write_text(json.dumps(data, indent=2, default=str))
            data["file_path"] = str(filepath)
            data["format"] = "json"

        # Persist record
        if site:
            ComplianceReport.objects.create(
                site=site,
                period_start=target_date,
                period_end=target_date,
                report_path=str(filepath),
            )

        return data

    # ------------------------------------------------------------------
    # DGMS Inspection Report
    # ------------------------------------------------------------------
    def generate_dgms_report(self, target_date=None):
        """Generate a DGMS (Directorate General of Mines Safety) format report."""
        Site, Zone, Worker, Violation, Alert, ComplianceReport = _get_models()
        target_date = target_date or date.today()
        month_start = target_date.replace(day=1)

        violations_qs = Violation.objects.filter(
            created_at__date__gte=month_start,
            created_at__date__lte=target_date,
        )

        total = violations_qs.count()
        critical = violations_qs.filter(
            Q(ppe_type='helmet') | Q(ppe_type='harness')
        ).count()

        zones_data = []
        for zone in Zone.objects.all():
            zone_violations = violations_qs.filter(zone=zone.name).count()
            zones_data.append({
                "zone": zone.name,
                "is_high_risk": zone.is_high_risk,
                "required_ppe": zone.required_ppe,
                "violations": zone_violations,
            })

        data = {
            "report_type": "dgms_inspection",
            "period": f"{month_start} to {target_date}",
            "total_violations": total,
            "critical_violations": critical,
            "zones": zones_data,
            "workers_count": Worker.objects.filter(is_active=True).count(),
            "sites_count": Site.objects.count(),
            "inspection_status": "COMPLIANT" if critical == 0 else "NON-COMPLIANT",
        }

        filename = f"dgms_report_{target_date}.json"
        filepath = self.REPORT_DIR / filename
        filepath.write_text(json.dumps(data, indent=2, default=str))
        data["file_path"] = str(filepath)
        data["format"] = "json"

        return data

    # ------------------------------------------------------------------
    # ESG Quarterly Report
    # ------------------------------------------------------------------
    def generate_esg_report(self, target_date=None):
        """Generate an ESG (Environmental, Social, Governance) quarterly report."""
        Site, Zone, Worker, Violation, Alert, ComplianceReport = _get_models()
        target_date = target_date or date.today()
        quarter_start = target_date.replace(
            month=((target_date.month - 1) // 3) * 3 + 1, day=1
        )

        violations_qs = Violation.objects.filter(
            created_at__date__gte=quarter_start,
            created_at__date__lte=target_date,
        )

        total = violations_qs.count()
        resolved = violations_qs.filter(resolved_at__isnull=False).count()
        resolution_rate = round(resolved / max(total, 1) * 100, 1)

        # Weekly trend within quarter
        weekly_trend = list(
            violations_qs.annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        data = {
            "report_type": "esg_quarterly",
            "quarter_start": str(quarter_start),
            "quarter_end": str(target_date),
            "total_incidents": total,
            "resolved_incidents": resolved,
            "resolution_rate_pct": resolution_rate,
            "zero_harm_days": max(0, (target_date - quarter_start).days - total),
            "safety_investment_score": round(resolution_rate * 0.85 + 10, 1),
            "daily_trend": weekly_trend,
            "workers_enrolled": Worker.objects.count(),
            "sites_covered": Site.objects.count(),
        }

        filename = f"esg_report_Q{((target_date.month - 1) // 3) + 1}_{target_date.year}.json"
        filepath = self.REPORT_DIR / filename
        filepath.write_text(json.dumps(data, indent=2, default=str))
        data["file_path"] = str(filepath)
        data["format"] = "json"

        return data

    # ------------------------------------------------------------------
    # PDF Builder (Daily Report)
    # ------------------------------------------------------------------
    def _build_daily_pdf(self, data, filepath):
        """Build a professional PDF for the daily compliance report."""
        if not _reportlab_available:
            return

        doc = SimpleDocTemplate(str(filepath), pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'ReportTitle', parent=styles['Title'],
            fontSize=20, spaceAfter=20,
            textColor=colors.HexColor('#1e3a5f'),
        )
        story.append(Paragraph("SafeGuard AI — Daily Compliance Report", title_style))
        story.append(Spacer(1, 10))

        # Metadata
        meta_style = styles['Normal']
        story.append(Paragraph(f"<b>Date:</b> {data['date']}", meta_style))
        story.append(Paragraph(f"<b>Site:</b> {data['site']}", meta_style))
        story.append(Spacer(1, 15))

        # Summary table
        summary_data = [
            ['Metric', 'Value'],
            ['Total Violations', str(data['total_violations'])],
            ['Resolved', str(data['resolved_violations'])],
            ['Compliance Rate', f"{data['compliance_rate']}%"],
            ['Avg Detection Confidence', f"{data['avg_confidence']}"],
            ['Active Workers', str(data['active_workers'])],
        ]
        t = Table(summary_data, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        # PPE Breakdown
        if data['by_ppe_type']:
            story.append(Paragraph("<b>Violations by PPE Type</b>", styles['Heading2']))
            ppe_rows = [['PPE Type', 'Count']]
            for item in data['by_ppe_type']:
                ppe_rows.append([item['ppe_type'].title(), str(item['count'])])
            pt = Table(ppe_rows, colWidths=[200, 100])
            pt.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d6a4f')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(pt)
            story.append(Spacer(1, 15))

        # Zone Breakdown
        if data['by_zone']:
            story.append(Paragraph("<b>Violations by Zone</b>", styles['Heading2']))
            zone_rows = [['Zone', 'Count']]
            for item in data['by_zone']:
                zone_rows.append([item['zone'], str(item['count'])])
            zt = Table(zone_rows, colWidths=[250, 100])
            zt.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6c3483')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(zt)

        # Footer
        story.append(Spacer(1, 30))
        footer_style = ParagraphStyle(
            'Footer', parent=styles['Normal'],
            fontSize=8, textColor=colors.grey,
        )
        story.append(Paragraph(
            "Generated by SafeGuard AI — Automated PPE Compliance Platform",
            footer_style,
        ))

        doc.build(story)
        logger.info(f"Daily report PDF generated: {filepath}")
