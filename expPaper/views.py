from django.views.generic import ListView
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from expPaper.models import ProfileField, ProfileFieldImage
from expPaper.serializers import ProfileFieldImageSerializer


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