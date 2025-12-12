#! /usr/bin/env bash

set -eux

cd "$(dirname "${BASH_SOURCE[0]}")"
# Set fake hash to trigger rebuild
echo -n "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" > assets-hash.txt
# Redirect stderr to stdout for grep while keeping printing on stderr
# In CI environments, /dev/tty may not be available, so we use a temp file
if [ -w /dev/tty ]; then
  HASH=$(nix build ..#airi.assets 2> >(tee /dev/tty) | grep -oP 'got: +\K\S+')
else
  HASH=$(nix build ..#airi.assets 2>&1 | tee /dev/stderr | grep -oP 'got: +\K\S+')
fi
echo -n $HASH > assets-hash.txt
