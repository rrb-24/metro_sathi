import http.server
import socketserver
import os
import sys

PORT = 8085
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class GitHubPagesSimulatorHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Translate URL path to local file path
        path = self.translate_path(self.path)
        
        # If resource does not exist, serve 404.html to emulate GitHub Pages behavior
        if not os.path.exists(path):
            # Keep index.html routing queries intact, only redirect routes that aren't physical files
            self.path = '/404.html'
            
        return super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), GitHubPagesSimulatorHandler) as httpd:
        print(f"Serving Metro Sathi at http://localhost:{PORT}")
        print("Simulating GitHub Pages 404 routing. Hitting refresh on subpaths will redirect correctly.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            sys.exit(0)
