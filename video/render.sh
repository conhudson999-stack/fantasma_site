#!/bin/bash
set -e
cd "$(dirname "$0")"

OUTPUT="../posts/booking-reel-$(date +%Y%m%d).mp4"
mkdir -p ../posts

echo "Rendering BookingReel..."
npx remotion render src/index.ts BookingReel "$OUTPUT" \
  --codec h264 \
  --image-format jpeg \
  --quality 90

echo "Done! Output: $OUTPUT"
