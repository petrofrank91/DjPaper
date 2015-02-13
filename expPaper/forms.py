from django.forms import ModelForm
from expPaper.models import ProfileField, ProfileFieldImage


class ProfileFieldForm(ModelForm):
    class Meta:
        model = ProfileField


class ProfileFieldImageForm(ModelForm):
    class Meta:
        model = ProfileFieldImage