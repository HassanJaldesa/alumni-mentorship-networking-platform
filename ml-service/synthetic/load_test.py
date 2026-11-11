"""Load test for NFR-01 (test case TC-14).

50 simulated users request mentor recommendations at the same time, through
the web app, exactly as students do (each request regenerates and stores the
recommendations). NFR-01 requires at least 95% of responses within 5 seconds.

Start both services and load the synthetic data first. For realistic timings
run the web app as a production build (npm run build, then npm start).
From the ml-service folder:

    python -m synthetic.load_test                  # 50 users x 5 requests, 3 runs
    python -m synthetic.load_test --users 50 --requests 5 --runs 3
"""
import argparse
import asyncio
import json
import re
import statistics
import time
from datetime import datetime
from pathlib import Path

import httpx

from synthetic.profiles import all_students

PASSWORD = "Synthetic2026"
LIMIT_SECONDS = 5.0
RESULTS_FILE = Path(__file__).parent / "load_test_results.json"


async def login(client: httpx.AsyncClient, email: str) -> str:
    response = await client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    response.raise_for_status()
    return re.search(r"session=([^;]+)", response.headers["set-cookie"]).group(1)


async def virtual_user(client: httpx.AsyncClient, token: str, requests: int, timings: list, errors: list):
    for _ in range(requests):
        start = time.perf_counter()
        try:
            response = await client.get("/student/recommendations", cookies={"session": token})
            elapsed = time.perf_counter() - start
            if response.status_code == 200 and "Mentor Recommendations" in response.text:
                timings.append(elapsed)
            else:
                errors.append(f"HTTP {response.status_code}")
        except httpx.HTTPError as error:
            errors.append(type(error).__name__)


def percentile(values: list[float], p: float) -> float:
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, round(p / 100 * len(ordered) + 0.5) - 1))
    return ordered[index]


async def run_once(base: str, users: int, requests: int, tokens: list[str]) -> dict:
    timings: list[float] = []
    errors: list[str] = []
    limits = httpx.Limits(max_connections=users, max_keepalive_connections=users)
    async with httpx.AsyncClient(base_url=base, timeout=60, limits=limits) as client:
        started = time.perf_counter()
        await asyncio.gather(*(
            virtual_user(client, tokens[i % len(tokens)], requests, timings, errors) for i in range(users)
        ))
        duration = time.perf_counter() - started
    within = sum(t <= LIMIT_SECONDS for t in timings)
    total = len(timings) + len(errors)
    return {
        "requests": total,
        "successful": len(timings),
        "errors": len(errors),
        "duration_s": round(duration, 1),
        "mean_s": round(statistics.mean(timings), 3) if timings else None,
        "median_s": round(statistics.median(timings), 3) if timings else None,
        "p95_s": round(percentile(timings, 95), 3) if timings else None,
        "max_s": round(max(timings), 3) if timings else None,
        "within_5s_pct": round(100 * within / total, 1) if total else 0.0,
    }


async def main_async(args) -> None:
    emails = [s.email for s in all_students()]
    async with httpx.AsyncClient(base_url=args.base_url, timeout=60) as client:
        print(f"Logging in {len(emails)} synthetic students...")
        tokens = [await login(client, email) for email in emails]
        await client.get("/student/recommendations", cookies={"session": tokens[0]})  # warm-up

    runs = []
    for number in range(1, args.runs + 1):
        result = await run_once(args.base_url, args.users, args.requests, tokens)
        runs.append(result)
        print(f"Run {number}: {result['requests']} requests in {result['duration_s']} s, "
              f"mean {result['mean_s']} s, p95 {result['p95_s']} s, max {result['max_s']} s, "
              f"within 5 s {result['within_5s_pct']}%, errors {result['errors']}")

    worst = min(r["within_5s_pct"] for r in runs)
    verdict = "PASS" if worst >= 95 else "FAIL"
    print(f"\nNFR-01 ({args.users} concurrent users, {args.requests} requests each, {args.runs} runs): "
          f"lowest share within 5 s = {worst}% -> {verdict}")
    RESULTS_FILE.write_text(json.dumps({
        "run_at": datetime.now().isoformat(timespec="seconds"), "base_url": args.base_url,
        "users": args.users, "requests_per_user": args.requests, "runs": runs, "verdict": verdict,
    }, indent=2))
    print(f"Saved to {RESULTS_FILE}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--users", type=int, default=50)
    parser.add_argument("--requests", type=int, default=5)
    parser.add_argument("--runs", type=int, default=3)
    asyncio.run(main_async(parser.parse_args()))


if __name__ == "__main__":
    main()
