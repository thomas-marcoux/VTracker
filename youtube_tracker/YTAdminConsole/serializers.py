from rest_framework import serializers
from youtube_tracker.models import Channels, Videos, VideosDaily


class ChannelsDash_serializer(serializers.ModelSerializer):

    total_subscribers = serializers.SerializerMethodField('get_total_subscribers')
    total_views = serializers.SerializerMethodField('get_total_views')
    total_videos = serializers.SerializerMethodField('get_total_videos')
    total_likes = serializers.SerializerMethodField('get_total_likes')
    extracted_date = serializers.SerializerMethodField('get_extracted_date')

    def get_total_subscribers(self,obj):
        return obj.total_subscribers
   
    def get_total_views(self,obj):
        return obj.total_views

    def get_total_videos(self,obj):
        return obj.total_videos

    def get_total_likes(self,obj):
        return obj.total_likes

    def get_extracted_date(self,obj):
        return obj.extracted_date
   
    # total_subscribers = serializers.Field(source='total_subscribers')
    # total_views = serializers.Field(source='total_views')
    # total_videos = serializers.Field(source='total_videos')
    # total_likes = serializers.Field(source='total_likes')
    # extracted_date = serializers.Field(source='extracted_date')
    class Meta:
        model = Channels
        fields = ("channel_title" 
                , "channel_id" 
                , "description"
                , "joined_data"
                , "total_subscribers" 
                , "total_views" 
                , "total_videos" 
                , "total_likes"
                , "extracted_date" 
                )
    
    



class ChannelsSimple_serializer(serializers.ModelSerializer):

    # total_subscribers = serializers.SerializerMethodField('get_total_subscribers')
    # total_views = serializers.SerializerMethodField('total_views')
    # total_videos = serializers.SerializerMethodField('total_videos')
    # total_likes = serializers.SerializerMethodField('total_likes')
    # extracted_date = serializers.SerializerMethodField('extracted_date')
   
    # total_subscribers = serializers.Field(source='total_subscribers')
    # total_views = serializers.Field(source='total_views')
    # total_videos = serializers.Field(source='total_videos')
    # total_likes = serializers.Field(source='total_likes')
    # extracted_date = serializers.Field(source='extracted_date')
    class Meta:
        model = Channels
        fields = ("channel_title" 
                , "channel_id" 
                , "description"
                , "joined_data"
                # , "total_subscribers" 
                # , "total_views" 
                # , "total_videos" 
                # , "total_likes"
                # , "extracted_date" 
                )
    # def get_total_subscribers(self,obj):
    #     return obj.total_subscribers
