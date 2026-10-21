#!/usr/bin/env python3
"""Reproduce the independent exact-Fraction review of MixShift.

Only Python standard-library modules are used. The supplied Node executable
imports the supplied local engine and communicates through stdin/stdout. No
project, database, network, browser, or result files are modified.

The arithmetic and enumeration preserve the review's actual inline run:
15,625 exhaustive three-group profiles plus 110 seeded 2..12-group profiles.
The wrapper below adds explicit engine/Node path arguments for reproducibility.
"""
import argparse
import itertools
import json
from pathlib import Path
import random
import subprocess
from fractions import Fraction as F


NODE_REFERENCE_BRIDGE = """
import {pathToFileURL} from 'node:url';
const {analyze,exact}=await import(pathToFileURL(process.argv[1]).href);
let s='';
for await(const c of process.stdin)s+=c;
const a=JSON.parse(s);
process.stdout.write(JSON.stringify(a.map(v=>{
  const r=analyze(v);
  return {
    values:Object.fromEntries(
      ['r00','r01','r10','r11','within','mix','headline','residual']
        .map(k=>[k,exact(r[k])])
    ),
    reversal:r.reversal
  };
})));
"""


def row(index, values):
    a, n, b, m = values
    return {
        'group': 'g' + str(index),
        'before_success': a,
        'before_total': n,
        'after_success': b,
        'after_total': m,
    }


def profiles_for_original_review():
    states = [(0, 1), (1, 1), (0, 2), (1, 2), (2, 2)]
    variants = [(a, n, b, m) for a, n in states for b, m in states]
    profiles = []
    for values in itertools.product(variants, repeat=3):
        profiles.append([row(i, value) for i, value in enumerate(values)])
    rng = random.Random(20261022)
    for count in range(2, 13):
        for _ in range(10):
            values = []
            for _ in range(count):
                n = rng.randint(1, 1000000 // count)
                m = rng.randint(1, 1000000 // count)
                values.append((rng.randint(0, n), n, rng.randint(0, m), m))
            profiles.append([row(i, value) for i, value in enumerate(values)])
    return profiles


def independent_expected(rows):
    """Counterfactual path averages; not the engine's direct half-sum formula."""
    n0 = sum(r['before_total'] for r in rows)
    n1 = sum(r['after_total'] for r in rows)
    old = F(sum(r['before_success'] for r in rows), n0)
    new = F(sum(r['after_success'] for r in rows), n1)
    rates_first = sum((
        F(r['before_total'], n0) * F(r['after_success'], r['after_total'])
        for r in rows
    ), F(0))
    mix_first = sum((
        F(r['after_total'], n1) * F(r['before_success'], r['before_total'])
        for r in rows
    ), F(0))
    within = ((rates_first - old) + (new - mix_first)) / 2
    mix = ((mix_first - old) + (new - rates_first)) / 2
    expected = {
        'r00': old, 'r01': rates_first, 'r10': mix_first, 'r11': new,
        'within': within, 'mix': mix, 'headline': new - old, 'residual': F(0),
    }
    changes = [
        F(r['after_success'], r['after_total'])
        - F(r['before_success'], r['before_total'])
        for r in rows
    ]
    if all(v > 0 for v in changes) and new < old:
        reversal = 'all_rise_aggregate_falls'
    elif all(v < 0 for v in changes) and new > old:
        reversal = 'all_fall_aggregate_rises'
    else:
        reversal = None
    return expected, reversal


def default_engine_path():
    adjacent = Path(__file__).resolve().with_name('engine.mjs')
    if adjacent.is_file():
        return adjacent
    return (Path(__file__).resolve().parents[2] / 'intermediate'
            / 'mixshift__app__2026-10-22__v001' / 'engine.mjs')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine', type=Path, default=default_engine_path(),
                        help='Local engine.mjs to validate (default: adjacent or original artifact engine).')
    parser.add_argument('--node', default='node',
                        help='Node executable path (default: node on PATH).')
    args = parser.parse_args()
    engine = args.engine.resolve(strict=True)
    if not engine.is_file():
        parser.error('--engine must identify a regular local file')
    profiles = profiles_for_original_review()
    process = subprocess.run(
        [args.node, '--input-type=module', '-e', NODE_REFERENCE_BRIDGE, str(engine)],
        input=json.dumps(profiles), text=True, capture_output=True, check=True,
    )
    outputs = json.loads(process.stdout)
    if len(outputs) != len(profiles):
        raise AssertionError('Engine result count differs from profile count')
    for index, (rows, got) in enumerate(zip(profiles, outputs)):
        expected, reversal = independent_expected(rows)
        for key, value in expected.items():
            reference = f'{value.numerator}/{value.denominator}'
            if got['values'][key] != reference:
                raise AssertionError((index, key, got['values'][key], reference))
        if got['reversal'] != reversal:
            raise AssertionError((index, 'reversal', got['reversal'], reversal))
    print(json.dumps({
        'independent_python_fraction_oracle': True,
        'exhaustive_three_group_profiles': 15625,
        'deterministic_2_to12group_profiles': 110,
        'total_profiles': len(profiles),
        'exact_fraction_fields_per_profile': 8,
        'all_matched': True,
        'seed': 20261022,
    }))


if __name__ == '__main__':
    main()
