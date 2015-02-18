from django.views.generic import ListView
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.generic.edit import CreateView, UpdateView, DeleteView

from expPaper.models import ProfileField, ProfileFieldImage
from expPaper.serializers import ProfileFieldImageSerializer
from expPaper.forms import ProfileFieldImageForm

import json
from django.shortcuts import _get_queryset
from django.http import HttpResponse
from django.core import serializers
from django.utils import simplejson
from django.core import serializers


class HomeView(ListView):
    model = ProfileField
    template_name = 'home.html'


class FieldImageList(APIView):
    """
    List all fieldImages, or create a new fieldImage.
    """
    def get(self, request, format=None):
        fieldImages = ProfileFieldImage.objects.all()
        serializer = ProfileFieldImageSerializer(fieldImages, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = ProfileFieldImageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FieldImageDetail(APIView):
    """
    Retrieve, update or delete a fieldImage instance.
    """
    def get_object(self, pk):
        try:
            return ProfileFieldImage.objects.get(pk=pk)
        except ProfileFieldImage.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        fieldImage = self.get_object(pk)
        serializer = ProfileFieldImageSerializer(fieldImage)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        fieldImage = self.get_object(pk)
        serializer = ProfileFieldImageSerializer(fieldImage, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        fieldImage = self.get_object(pk)
        fieldImage.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def render_to_json_response(context, **response_kwargs):
    # returns a JSON response, transforming 'context' to make the payload
    response_kwargs['content_type'] = 'application/json'
    return HttpResponse(json.dumps(context), **response_kwargs)


class AjaxFormResponseMixin(object):

    def form_invalid(self, form):
        return render_to_json_response(form.errors, status=400)

    def form_valid(self, form):
        self.object = form.save()
        context = self.object.as_json()

        # return the context as json
        return render_to_json_response(context)


class ServerList(ListView):
    model = ProfileFieldImage

    def get(self, request, *args, **kwargs):
        dictionaries = [obj.as_json() for obj in self.get_queryset()]
        return render_to_json_response(dictionaries)


class ServerCreate(AjaxFormResponseMixin, CreateView):
    model = ProfileFieldImage
    form_class = ProfileFieldImageForm


class ServerUpdate(AjaxFormResponseMixin, UpdateView):
    model = ProfileFieldImage
    form_class = ProfileFieldImageForm


class ServerDelete(DeleteView):
    model = ProfileFieldImage
    form_class = ProfileFieldImageForm

    def delete(self, request, *args, **kwargs):
        try:
            self.object = self.get_object()
            self.object.delete()
        except Exception:
            return render_to_json_response({'success': False})
        return render_to_json_response({'success': True})


