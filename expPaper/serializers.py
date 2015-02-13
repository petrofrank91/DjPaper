from django.contrib.auth.models import User, Group
from rest_framework import serializers
from expPaper.models import ProfileField, ProfileFieldImage


class ProfileFieldImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileFieldImage
        fields = ('id', 'profile', 'left', 'top', 'width', 'height')
