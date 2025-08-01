#!/usr/bin/env python3
"""Mirror cannabisdatabase.ca into the local science corpus."""

import argparse
import subprocess
from pathlib import Path


def build_wget_command(url: str, output_dir: Path) -> list[str]:
    return [
        "wget",
        "--mirror",
        "--convert-links",
        "--adjust-extension",
        "--page-requisites",
        "--no-parent",
        "--reject=jpg,jpeg,png,gif,svg,css,js",
        "--execute", "robots=off",
        "--directory-prefix", str(output_dir),
        url,
    ]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Mirror cannabisdatabase.ca into science-data/corpus"
    )
    parser.add_argument(
        "--output-dir",
        default="science-data/corpus/cannabisdatabase_ca",
        help="Directory to store mirrored website",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print wget command without executing",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd = build_wget_command("https://cannabisdatabase.ca", output_dir)
    if args.dry_run:
        print(" ".join(cmd))
    else:
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
