// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as TraceModel from '../../../../../../front_end/models/trace/trace.js';
import {loadEventsFromTraceFile} from '../../../helpers/TraceHelpers.js';

describe('UserTimingsHandler', () => {
  let timingsData: TraceModel.Handlers.ModelHandlers.UserTimings.UserTimingsData;
  before(async () => {
    const events = await loadEventsFromTraceFile('user-timings.json.gz');
    TraceModel.Handlers.ModelHandlers.UserTimings.reset();
    for (const event of events) {
      TraceModel.Handlers.ModelHandlers.UserTimings.handleEvent(event);
    }
    await TraceModel.Handlers.ModelHandlers.UserTimings.finalize();
    timingsData = TraceModel.Handlers.ModelHandlers.UserTimings.data();
  });
  describe('performance.measure events parsing', () => {
    it('parses the start and end events and returns a list of blocks', async () => {
      assert.lengthOf(timingsData.performanceMeasures, 3);
      assert.strictEqual(timingsData.performanceMeasures[0].id, '0x9072211');
      assert.strictEqual(timingsData.performanceMeasures[0].name, 'first measure');
      assert.strictEqual(timingsData.performanceMeasures[1].id, '0x6ece31c8');
      assert.strictEqual(timingsData.performanceMeasures[1].name, 'second measure');
      assert.strictEqual(timingsData.performanceMeasures[2].id, '0x10c31982');
      assert.strictEqual(timingsData.performanceMeasures[2].name, 'third measure');

      // Ensure we assign begin + end the right way round by making sure the
      // beginEvent is the ASYNC_NESTABLE_START and the endEvent is the
      // ASYNC_NESTABLE_END.
      for (let i = 0; i < timingsData.performanceMeasures.length; i++) {
        assert.strictEqual(
            timingsData.performanceMeasures[i].args.data.beginEvent.ph,
            TraceModel.Types.TraceEvents.Phase.ASYNC_NESTABLE_START);
        assert.strictEqual(
            timingsData.performanceMeasures[i].args.data.endEvent.ph,
            TraceModel.Types.TraceEvents.Phase.ASYNC_NESTABLE_END);
      }
    });

    it('sorts the blocks to ensure they are in time order', async () => {
      const events = await loadEventsFromTraceFile('user-timings.json.gz');
      TraceModel.Handlers.ModelHandlers.UserTimings.reset();
      // Reverse the array so that the events are in the wrong order.
      // This _shouldn't_ ever happen in a real trace, but it's best for us to
      // sort the blocks once we've parsed them just in case.
      const reversed = events.slice().reverse();
      for (const event of reversed) {
        TraceModel.Handlers.ModelHandlers.UserTimings.handleEvent(event);
      }
      await TraceModel.Handlers.ModelHandlers.UserTimings.finalize();
      const data = TraceModel.Handlers.ModelHandlers.UserTimings.data();
      assert.lengthOf(data.performanceMeasures, 3);
      assert.isTrue(data.performanceMeasures[0].ts <= data.performanceMeasures[1].ts);
      assert.isTrue(data.performanceMeasures[1].ts <= data.performanceMeasures[2].ts);
    });

    it('calculates the duration correctly from the begin/end event timestamps', async () => {
      const events = await loadEventsFromTraceFile('user-timings.json.gz');
      TraceModel.Handlers.ModelHandlers.UserTimings.reset();
      for (const event of events) {
        TraceModel.Handlers.ModelHandlers.UserTimings.handleEvent(event);
      }
      await TraceModel.Handlers.ModelHandlers.UserTimings.finalize();
      const data = TraceModel.Handlers.ModelHandlers.UserTimings.data();
      for (const timing of data.performanceMeasures) {
        // Ensure for each timing pair we've set the dur correctly.
        assert.strictEqual(timing.dur, timing.args.data.endEvent.ts - timing.args.data.beginEvent.ts);
      }
    });
  });
  describe('performance.mark events parsing', () => {
    it('parses performance mark events correctly', () => {
      assert.lengthOf(timingsData.performanceMarks, 2);
      assert.strictEqual(timingsData.performanceMarks[0].name, 'mark1');
      assert.strictEqual(timingsData.performanceMarks[1].name, 'mark3');
    });
  });
});
