from django.db import models


class ProfileField(models.Model):
    field_name = models.CharField(max_length=255)
    field_value = models.CharField(max_length=255)

    def __str__(self):
        return '%s %s' % (self.field_name, self.field_value)


class ProfileFieldImage(models.Model):
    profile = models.ForeignKey(ProfileField)
    left = models.IntegerField()
    top = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()

    def as_json(self):
        return dict(
            id=self.id,
            profile=self.profile,
            left=self.left,
            top=self.top,
            width=self.width,
            height=self.height)
