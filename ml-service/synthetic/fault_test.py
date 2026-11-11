"""Fault-injection test for NFR-07.

Checks that when the recommendation service is stopped, students still see
their most recently stored recommendations and the rest of the platform keeps
working. The script pauses and asks you to stop, then restart, the service.

From the ml-service folder, with the web app running:

    python -m synthetic.fault_test
"""
import argparse
import re

import httpx

NOTICE = "The recommendation service is unavailable right now"
MENTOR_LINK = re.compile(r"/student/mentors/([0-9a-f-]{36})")


def mentor_cards(html: str) -> int:
    """Number of different mentors linked from the page."""
    return len(set(MENTOR_LINK.findall(html)))
PAGES = ["/student", "/student/recommendations", "/student/mentorships", "/student/profile"]


def check(client: httpx.Client, token: str, label: str) -> bool:
    print(f"\n{label}")
    ok = True
    for path in PAGES:
        response = client.get(path, cookies={"session": token})
        cards = mentor_cards(response.text)
        notice = NOTICE in response.text
        print(f"  {path:<26} HTTP {response.status_code}  mentor cards: {cards:<2}  fallback notice: {notice}")
        ok = ok and response.status_code == 200
    return ok


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--email", default="amina.hussein@synthetic.test")
    args = parser.parse_args()

    with httpx.Client(base_url=args.base_url, timeout=30) as client:
        login = client.post("/api/auth/login", json={"email": args.email, "password": "Synthetic2026"})
        login.raise_for_status()
        token = re.search(r"session=([^;]+)", login.headers["set-cookie"]).group(1)

        up = check(client, token, "1. Recommendation service running")
        input("\nStop the recommendation service now (Ctrl+C in its terminal), then press Enter here...")
        page = client.get("/student/recommendations", cookies={"session": token}).text
        down = check(client, token, "2. Recommendation service stopped")
        fallback = NOTICE in page and mentor_cards(page) > 0
        input("\nStart the recommendation service again, wait for 'Application startup complete', then press Enter...")
        again = check(client, token, "3. Recommendation service restarted")

    passed = up and down and again and fallback
    print(f"\nNFR-07: stored recommendations shown while the service was down: {fallback}; "
          f"all pages available throughout: {up and down and again} -> {'PASS' if passed else 'FAIL'}")


if __name__ == "__main__":
    main()
