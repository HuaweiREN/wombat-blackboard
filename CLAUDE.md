# CLAUDE.md

This file provides guidance to Claude Code when working on the Wombat-Blackboard project.

## Project Overview

Wombat-Blackboard converts natural language descriptions into Mermaid/PlantUML diagram code that users paste into Feishu (Lark) drawing boards. Target audience: automotive intelligent driving system PMs, FOs, system engineers, architects.

## Key Documents

- `docs/PRD.md` — Full product requirements document

## Project Stage

Phase 1 MVP: Prompt engineering for NL → Mermaid/PlantUML, domain template library, syntax validation.

## Domain Context

The automotive AD/ADAS domain has specific terminology (HWP, NOD, ODD, ASIL, CAN/ETH/LIN, etc.) that must be recognized and correctly mapped to diagram semantics. See PRD Section 6 for the domain glossary.

## Development Principles

Follow workspace-level CLAUDE.md guidelines: think before coding, simplicity first, surgical changes, goal-driven execution.
