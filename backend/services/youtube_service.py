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
        """Downloads audio from a YouTube URL preferring m4a format."""
        file_id = str(uuid.uuid4())[:8]
        # Prefer m4a which is often more compatible with Windows audio decoders
        out_template = os.path.join(self.download_path, f"{file_id}.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio/best', # Prefer m4a
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
        """Searches YouTube for a query and returns a list of results sorted by date."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'force_generic_utils': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # We fetch more to allow filtering and sorting
            info = ydl.extract_info(f"ytsearch{max_results if max_results > 50 else 50}:{query}", download=False)
            results = []
            for entry in info.get('entries', []):
                video_id = entry.get('id')
                title = entry.get('title')
                duration = entry.get('duration')
                uploader = entry.get('uploader')
                upload_date = entry.get('upload_date') # YYYYMMDD
                
                # STRICT FILTERS:
                if not video_id or len(video_id) != 11:
                    continue
                if duration is None:
                    continue
                if title == uploader and duration == 0:
                    continue

                results.append({
                    'id': video_id,
                    'title': title,
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'thumbnail': entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else None,
                    'duration': duration,
                    'channel': uploader,
                    'upload_date': upload_date
                })
            
            # SORT BY DATE (Newest first)
            # YouTube search doesn't always return upload_date in flat extraction, 
            # but if it does, we sort. If not, we fall back to YouTube's default order.
            results.sort(key=lambda x: x.get('upload_date') or '00000000', reverse=True)
            
            print(f"DEBUG: Found and sorted {len(results)} valid videos for query: {query}")
            # Limit to the requested max_results
            return results[:max_results]
