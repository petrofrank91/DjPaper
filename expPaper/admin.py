from django.contrib import admin
from expPaper.models import ProfileField, ProfileFieldImage


class FieldAdmin(admin.ModelAdmin):
    list_display = ('field_name', 'field_value')


class FieldImageAdmin(admin.ModelAdmin):
    list_display = ('link_to', 'left', 'top', 'width', 'height')

    def link_to(self, model_instance):
        return model_instance.profile


admin.site.register(ProfileField, FieldAdmin)

admin.site.register(ProfileFieldImage, FieldImageAdmin)
