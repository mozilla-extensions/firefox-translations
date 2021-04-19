"""Intercept Glean pings, save them to disk and reply without sending any data to the remote server."""

import json
import os

from mitmproxy import ctx, http


class GleanTelemetryInterceptor:
    def __init__(self):
        self.telemetry_storage_path = None

    def load(self, loader):
        loader.add_option(
            name="glean_app_id",
            typespec=str,
            default="",
            help="The Glean app id to intercept messages for",
        )
        loader.add_option(
            name="proxy_instance_id",
            typespec=str,
            default="",
            help="A proxy id for this proxy instantiation",
        )

    def ensure_telemetry_storage_path(self):
        if self.telemetry_storage_path:
            return

        # Setup telemetry storage path
        current_dir_path = os.path.dirname(os.path.realpath(__file__))
        self.telemetry_storage_path = os.path.join(
            current_dir_path, "results", "telemetry", ctx.options.proxy_instance_id
        )
        os.makedirs(self.telemetry_storage_path, exist_ok=True)

        print(
            f"Proxy server telemetry interceptor configured. Telemetry storage path set to {self.telemetry_storage_path}"
        )

    def request(self, flow: http.HTTPFlow) -> None:
        if ctx.options.glean_app_id == "":
            raise Exception("The option glean_app_id must be set")
        if ctx.options.proxy_instance_id == "":
            raise Exception("The option proxy_instance_id must be set")
        self.ensure_telemetry_storage_path()
        if flow.request.pretty_url.startswith(
            f"https://incoming.telemetry.mozilla.org/submit/{ctx.options.glean_app_id}"
        ):
            # Parse request contents
            parsed = json.loads(flow.request.text)
            formatted_json_string = json.dumps(
                parsed, indent=4, sort_keys=True)
            print("formatted_json_string", formatted_json_string)

            # Save response
            filename = f'{parsed["ping_info"]["seq"]}.json'
            with open(os.path.join(self.telemetry_storage_path, filename), "w") as f:
                f.write(formatted_json_string)

            # Respond without sending request to external server
            ctx.log.info(
                f"Intercepted telemetry request (stored as {filename}), responding with a 200 OK without actually sending request to external server"
            )
            flow.response = http.HTTPResponse.make(200)


addons = [GleanTelemetryInterceptor()]
