from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Site, Zone, Worker, Violation, Alert, ComplianceReport


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['email'] = self.user.email
        data['username'] = self.user.username
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = '__all__'


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = '__all__'


class WorkerSerializer(serializers.ModelSerializer):
    violation_count = serializers.SerializerMethodField()

    class Meta:
        model = Worker
        fields = '__all__'

    def get_violation_count(self, obj):
        return obj.violations.count()


class ViolationSerializer(serializers.ModelSerializer):
    worker_name = serializers.SerializerMethodField()

    class Meta:
        model = Violation
        fields = '__all__'

    def get_worker_name(self, obj):
        return obj.worker.name if obj.worker else "Unknown"


class AlertSerializer(serializers.ModelSerializer):
    violation_detail = ViolationSerializer(source='violation', read_only=True)

    class Meta:
        model = Alert
        fields = '__all__'


class ComplianceReportSerializer(serializers.ModelSerializer):
    site_name = serializers.SerializerMethodField()

    class Meta:
        model = ComplianceReport
        fields = '__all__'

    def get_site_name(self, obj):
        return obj.site.name if obj.site else None
