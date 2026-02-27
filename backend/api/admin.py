from django.contrib import admin
from .models import User, Site, Zone, Worker, Violation, Alert, ComplianceReport

admin.site.register(User)
admin.site.register(Site)
admin.site.register(Zone)
admin.site.register(Worker)
admin.site.register(Violation)
admin.site.register(Alert)
admin.site.register(ComplianceReport)
