#!/usr/bin/env bash
set -e
set -x

rsync --recursive --verbose --delete --exclude '.git' . andy@leo.uberspace.de:/home/andy/code/petition
ssh andy@leo.uberspace.de supervisorctl restart petition
