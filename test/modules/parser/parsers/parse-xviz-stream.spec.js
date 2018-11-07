// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable camelcase */
import {setXvizSettings} from '@xviz/parser';
import {parseStreamTimeSeries, parseStreamVariable} from '@xviz/parser/parsers/parse-xviz-stream';
import {XVIZValidator} from '@xviz/schema';

import tape from 'tape-catch';

const schemaValidator = new XVIZValidator();

tape('parseStreamTimeSeries#simple', t => {
  setXvizSettings({currentMajorVersion: 2});

  const testData = [
    {
      timestamp: 1001,
      streams: ['/test/doubles', '/test/doubles2'],
      values: {
        doubles: [23.32, 32.23]
      }
    },
    {
      timestamp: 1002,
      streams: ['/test/int32s'],
      values: {
        int32s: [23]
      }
    },
    {
      timestamp: 1003,
      streams: ['/test/bools'],
      values: {
        bools: [false]
      }
    },
    {
      timestamp: 1004,
      streams: ['/test/strings'],
      values: {
        strings: ['test string']
      },
      object_id: '123'
    }
  ];

  const expected = {
    '/test/doubles': {
      time: 1001,
      variable: 23.32
    },
    '/test/doubles2': {
      time: 1001,
      variable: 32.23
    },
    '/test/int32s': {
      time: 1002,
      variable: 23
    },
    '/test/bools': {
      time: 1003,
      variable: false
    },
    '/test/strings': {
      time: 1004,
      variable: 'test string',
      id: '123'
    }
  };

  testData.forEach(d => schemaValidator.validate('core/timeseries_state', d));

  const result = parseStreamTimeSeries(testData, new Map());
  t.deepEquals(result, expected, 'time_series parsed properly');

  t.end();
});

tape('parseStreamVariable#simple v2', t => {
  setXvizSettings({currentMajorVersion: 2});

  const time = 1001;
  const testData = {
    variables: [
      {
        values: {
          doubles: [10, 11, 12]
        }
      },
      {
        values: {
          int32s: [10, 11, 12]
        }
      },
      {
        values: {
          bools: [true, false, true]
        }
      },
      {
        values: {
          strings: ['one', 'two', 'three']
        },
        base: {
          object_id: '123'
        }
      }
    ]
  };

  const expected = {
    time: 1001,
    variable: [
      {
        values: [10, 11, 12]
      },
      {
        values: [10, 11, 12]
      },
      {
        values: [true, false, true]
      },
      {
        values: ['one', 'two', 'three'],
        id: '123'
      }
    ]
  };

  schemaValidator.validate('core/variable_state', testData);

  const result = parseStreamVariable(testData, '/test', time);
  t.deepEquals(result, expected, 'variables parsed properly');

  t.end();
});

tape('parseStreamVariable#simple v1', t => {
  setXvizSettings({currentMajorVersion: 1});

  const time = 1001;
  const testSet = [
    {
      xviz: {
        timestamps: [1011, 1021],
        type: 'string',
        values: ['Right', 'Left']
      },
      expected: {
        time: 1001,
        variable: [[1011, 'Right'], [1021, 'Left']]
      },
      name: 'string'
    },
    {
      xviz: {
        timestamps: [1011, 1021],
        type: 'bool',
        values: [true, false]
      },
      expected: {
        time: 1001,
        variable: [[1011, true], [1021, false]]
      },
      name: 'bool'
    },
    {
      xviz: {
        timestamps: [1011, 1021],
        type: 'float',
        values: [100.1, 100.2]
      },
      expected: {
        time: 1001,
        variable: [[1011, 100.1], [1021, 100.2]]
      },
      name: 'float'
    }
  ];

  testSet.forEach(testCase => {
    const result = parseStreamVariable(testCase.xviz, '/test', time);
    t.deepEquals(result, testCase.expected, `variables type ${testCase.name} parsed properly`);
  });

  t.end();
});
