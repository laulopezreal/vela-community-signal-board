# Weekend Challenge Submission Draft

## Project Name
Community Signal Board

## One-line summary
A simple board that helps small founder and operator communities turn scattered updates into one ranked daily digest.

## Community Served
Small founder and operator communities that currently miss opportunities because updates are spread across multiple channels.

## Problem
High-value signals such as intros, grants, events, and hiring opportunities get buried in chat noise.

## Solution
A lightweight app that captures updates quickly, ranks them transparently, supports live triage controls, and exports a markdown digest for async team alignment.

## Core Features
- Manual signal ingestion (title, source, urgency, category, relevance)
- Deterministic ranking (`urgency * 2 + relevance`)
- Live search + dashboard filtering (category + urgency) + clear reset
- Reliability guards (duplicate prevention, score clamping, empty-export prevention)
- Markdown digest export for async distribution

## Why this is a good challenge fit
- Clearly serves a real community with an explicit pain point
- Delivers immediate utility with a focused MVP
- Prioritizes reliability and usability over extra complexity

## Demo Script (90 seconds)
1. Add three signals from different sources.
2. Show ranking order and explain urgency-weighted score.
3. Filter to critical opportunities.
4. Export digest markdown and open the file.
5. Close with impact: fewer missed opportunities, faster shared awareness.

## Project Link
- Repo URL: `https://github.com/laulopezreal/vela-community-signal-board`
- Demo screenshot: `/home/lauureal/.openclaw/media/browser/7b3e835e-38e1-4903-9c3a-48d318e91fca.jpg`

## Run Instructions
- Root: `vela-mock`
- Start: `cd app && python3 -m http.server 5173`
- Open: `http://localhost:5173`
