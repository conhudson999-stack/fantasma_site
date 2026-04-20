#!/bin/bash
# Render the booking walkthrough video to MP4
set -e

OUTPUT_DIR="../posts"
OUTPUT_FILE="$OUTPUT_DIR/booking-walkthrough-$(date +%Y%m%d).mp4"

mkdir -p "$OUTPUT_DIR"

echo "Rendering BookingWalkthrough..."
npx remotion render src/index.ts BookingWalkthrough "$OUTPUT_FILE" \
  --codec h264 \
  --image-format jpeg \
  --quality 90

echo "Done! Output: $OUTPUT_FILE"
