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
        return {
            'id': self.id,
            'profile': self.profile.pk,
            'left': self.left,
            'top': self.top,
            'width': self.width,
            'height': self.height}


class Author(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name;


class Book(models.Model):
    title = models.CharField(max_length=250)
    authors = models.ManyToManyField(Author)