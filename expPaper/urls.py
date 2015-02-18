from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView
from expPaper import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = patterns('',
    url(r'^$', views.HomeView.as_view(), name='server_list'),
    url(r'^v1/images/$', views.FieldImageList.as_view()),
    url(r'^v1/images/(?P<pk>[0-9]+)/$', views.FieldImageDetail.as_view()),

    #url(r'^create/$', views.create, name='server_new'),
    #url(r'^edit/(?P<pk>\d+)$', views.update, name='server_edit'),
    #url(r'^delete/(?P<pk>\d+)$', views.delete, name='server_delete'),
    url(r'^v2/images/$', views.ServerList.as_view(), name='server_all'),
    url(r'^v2/images/create/$', views.ServerCreate.as_view(), name='server_new'),
    url(r'^v2/images/update/(?P<pk>\d+)/$', views.ServerUpdate.as_view(), name='server_edit'),
    url(r'^v2/images/delete/(?P<pk>\d+)/$', views.ServerDelete.as_view(), name='server_delete'),
) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
