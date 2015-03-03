from itertools import chain

from django.contrib import admin
from django import forms
from django.contrib.admin.templatetags.admin_static import static
from django.contrib.admin import widgets
from django.utils.safestring import mark_safe
from django.utils.html import format_html
from django.utils.datastructures import MultiValueDict, MergeDict
from django.forms.util import flatatt
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _

from expPaper.models import ProfileField, ProfileFieldImage, Author, Book


class FieldAdmin(admin.ModelAdmin):
    list_display = ('field_name', 'field_value')


class FieldImageAdmin(admin.ModelAdmin):
    list_display = ('link_to', 'left', 'top', 'width', 'height')

    def link_to(self, model_instance):
        return model_instance.profile


admin.site.register(ProfileField, FieldAdmin)

admin.site.register(ProfileFieldImage, FieldImageAdmin)


class AutoCompleteSelectMultiple(forms.Select):
    allow_multiple_selected = True

    def render(self, name, value, attrs=None, choices=()):
        if value is None: value = []
        final_attrs = self.build_attrs(attrs, name=name)
        output = [format_html('<select multiple="multiple"{0}>', flatatt(final_attrs))]
        options = self.render_options(choices, value)
        if options:
            output.append(options)
        output.append('</select>')
        return mark_safe('\n'.join(output))

    def value_from_datadict(self, data, files, name):
        if isinstance(data, (MultiValueDict, MergeDict)):
            return data.getlist(name)
        return data.get(name, None)

    def render_options(self, choices, selected_choices):
        # Normalize to strings.
        selected_choices = set(force_text(v) for v in selected_choices)
        output = []
        for option_value, option_label in chain(self.choices, choices):
            if isinstance(option_label, (list, tuple)):
                output.append(format_html('<optgroup label="{0}">', force_text(option_value)))
                for option in option_label:
                    output.append(self.render_option(selected_choices, *option))
                output.append('</optgroup>')
            else:
                formatted_value = force_text(option_value)
                if formatted_value in selected_choices:
                    output.append(format_html('<option value="{0}">{1}</option>',
                           formatted_value,
                           force_text(option_label)))
        return '\n'.join(output)


class AutoCompleteFilteredSelectMultiple(AutoCompleteSelectMultiple):
    """
    A SelectMultiple with a JavaScript filter interface.

    Note that the resulting JavaScript assumes that the jsi18n
    catalog has been loaded in the page
    """
    @property
    def media(self):
        js = ["core.js", "jquery.autocomplete.js", "autocomplete.js", "SelectBox.js"]
        css = ["autocomplete.css"]
        return forms.Media(js=[static("admin/js/%s" % path) for path in js],
                           css={'all': [static("admin/css/%s" % path) for path in css]})

    def __init__(self, verbose_name, is_stacked, attrs=None, choices=()):
        self.verbose_name = verbose_name
        self.is_stacked = is_stacked
        super(AutoCompleteFilteredSelectMultiple, self).__init__(attrs, choices)

    def render(self, name, value, attrs=None, choices=()):
        if attrs is None:
            attrs = {}
        attrs['class'] = 'selectfilter'
        if self.is_stacked:
            attrs['class'] += 'stacked'
        output = [super(AutoCompleteFilteredSelectMultiple, self).render(name, value, attrs, choices)]
        output.append('<script type="text/javascript">addEvent(window, "load", function(e) {')
        # TODO: "id_" is hard-coded here. This should instead use the correct
        # API to determine the ID dynamically.
        output.append('SelectAutocompleteFilter.init("id_%s", "%s", %s, "%s"); });</script>\n'
           % (name, self.verbose_name.replace('"', '\\"'), int(self.is_stacked), static('admin/')))
        return mark_safe(''.join(output))


class CustomModelAdmin(admin.ModelAdmin):

    def formfield_for_manytomany(self, db_field, request=None, **kwargs):
        """
        Get a form Field for a ManyToManyField.
        """
        # If it uses an intermediary model that isn't auto created, don't show
        # a field in admin.
        if not db_field.rel.through._meta.auto_created:
            return None
        db = kwargs.get('using')

        if db_field.name in self.raw_id_fields:
            kwargs['widget'] = widgets.ManyToManyRawIdWidget(db_field.rel,
                                    self.admin_site, using=db)
            kwargs['help_text'] = ''
        elif db_field.name in (list(self.filter_vertical) + list(self.filter_horizontal)):
            kwargs['widget'] = AutoCompleteFilteredSelectMultiple(db_field.verbose_name, (db_field.name in self.filter_vertical))
            #kwargs['widget'] = widgets.FilteredSelectMultiple(db_field.verbose_name, (db_field.name in self.filter_vertical))

        queryset = self.get_field_queryset(db, db_field, request)
        if queryset is not None:
            kwargs['queryset'] = queryset

        db_field.help_text = _('Hold down "Control", or "Command" on a Mac, to select more than one.')
        return db_field.formfield(**kwargs)


#class BookAdmin(admin.ModelAdmin):
class BookAdmin(CustomModelAdmin):
     model= Book
     filter_horizontal = ('authors',)

admin.site.register(Author)
admin.site.register(Book, BookAdmin)
