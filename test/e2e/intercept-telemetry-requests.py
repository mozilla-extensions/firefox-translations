"""Send a reply from the proxy without sending any data to the remote server."""
from mitmproxy import http, ctx


def request(flow: http.HTTPFlow) -> None:
    if flow.request.pretty_url.startswith("https://incoming.telemetry.mozilla.org/submit/org-mozilla-bergamot"):
        ctx.log.info("Intercepted telemetry request, responding with a 200 OK without actually requested external server")
        print("flow.request.text", flow.request.text)
        flow.response = http.HTTPResponse.make(
            200,  # (optional) status code
            # b"Hello World",  # (optional) content
            # {"Content-Type": "text/html"}  # (optional) headers
        )
