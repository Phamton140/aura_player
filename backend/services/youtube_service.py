import os
import yt_dlp
import uuid
from datetime import datetime

class YouTubeService:
    def __init__(self, download_path="temp"):
        self.download_path = download_path
        if not os.path.exists(self.download_path):
            os.makedirs(self.download_path)

    def download_audio(self, url: str):
        """Downloads audio from a YouTube URL."""
        file_id = str(uuid.uuid4())[:8]
        out_template = os.path.join(self.download_path, f"{file_id}.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio/best',
            'outtmpl': out_template,
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            ext = info.get('ext', 'm4a')
            filename = os.path.join(self.download_path, f"{file_id}.{ext}")
            return filename, info.get('title', 'Unknown')

    def search_videos(self, query: str, max_results=30):
        """Fast search with basic heuristic filtering."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # We fetch more to allow basic filtering
            search_count = max_results + 10
            info = ydl.extract_info(f"ytsearch{search_count}:{query}", download=False)
            
            raw_entries = info.get('entries', [])
            results = []
            
            for entry in raw_entries:
                video_id = entry.get('id')
                if not video_id or len(video_id) != 11: continue
                
                # Basic heuristic filters (fast)
                if entry.get('availability') and entry.get('availability') != 'public':
                    continue
                if entry.get('age_limit', 0) > 0:
                    continue
                    
                results.append({
                    'id': video_id,
                    'title': entry.get('title'),
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'thumbnail': entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else None,
                    'duration': entry.get('duration'),
                    'channel': entry.get('uploader'),
                    'upload_date': entry.get('upload_date')
                })

            # SORT BY DATE
            results.sort(key=lambda x: x.get('upload_date') or '00000000', reverse=True)
            
            return results[:max_results]
