"""Send a reply from the proxy without sending any data to the remote server."""
# Setup telemetry storage path
import os
from datetime import datetime
import json

from mitmproxy import ctx, http

current_dir_path = os.path.dirname(os.path.realpath(__file__))
now = datetime.now()
date_time = now.strftime("%Y-%m-%d-%H%M%S")
telemetry_path = os.path.join(
    current_dir_path, "results", "telemetry", date_time)
os.makedirs(telemetry_path)

print(
    f"Proxy server telemetry interceptor configured to store seen telemetry in {telemetry_path}"
)


def request(flow: http.HTTPFlow) -> None:
    if flow.request.pretty_url.startswith(
        "https://incoming.telemetry.mozilla.org/submit/org-mozilla-bergamot"
    ):
        # parse request contents
        print("flow.request.text", flow.request.text)
        parsed = json.loads(flow.request.text)
        formatted_json_string = json.dumps(parsed, indent=4, sort_keys=True)
        print("formatted_json_string", formatted_json_string)

        # save response
        filename = f'{parsed["ping_info"]["seq"]}.json'
        with open(os.path.join(telemetry_path, filename), "w") as f:
            f.write(formatted_json_string)

        # respond without sending request to external server
        ctx.log.info(
            f"Intercepted telemetry request (stored as {filename}), responding with a 200 OK without actually sending request to external server"
        )
        flow.response = http.HTTPResponse.make(200)
