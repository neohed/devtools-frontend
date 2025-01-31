// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Timeline from '../../../../../front_end/panels/timeline/timeline.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';
import {traceModelFromTraceFile} from '../../helpers/TimelineHelpers.js';
import {loadModelDataFromTraceFile, setTraceModelTimeout} from '../../helpers/TraceHelpers.js';

import type * as Platform from '../../../../../front_end/core/platform/platform.js';

const {assert} = chai;

describeWithEnvironment('TimelineHistoryManager', function() {
  setTraceModelTimeout(this);

  let historyManager: Timeline.TimelineHistoryManager.TimelineHistoryManager;
  beforeEach(() => {
    UI.ActionRegistration.registerActionExtension({
      actionId: 'timeline.show-history',
      async loadActionDelegate() {
        return Timeline.TimelinePanel.ActionDelegate.instance();
      },
      category: UI.ActionRegistration.ActionCategory.PERFORMANCE,
      title: () => '' as Platform.UIString.LocalizedString,
      contextTypes() {
        return [Timeline.TimelinePanel.TimelinePanel];
      },
      bindings: [
        {
          platform: UI.ActionRegistration.Platforms.WindowsLinux,
          shortcut: 'Ctrl+H',
        },
        {
          platform: UI.ActionRegistration.Platforms.Mac,
          shortcut: 'Meta+Y',
        },
      ],
    });
    UI.ActionRegistry.ActionRegistry.instance({forceNew: true});
    historyManager = new Timeline.TimelineHistoryManager.TimelineHistoryManager();
  });

  afterEach(() => {
    UI.ActionRegistry.ActionRegistry.reset();
  });

  it('can select from multiple parsed data objects', async () => {
    // Add two parsed data objects to the history manager.
    const firstTraceFileName = 'slow-interaction-button-click.json.gz';
    const firstLegacyModel = await traceModelFromTraceFile(firstTraceFileName);
    const firstTraceParsedData = await loadModelDataFromTraceFile(firstTraceFileName);
    historyManager.addRecording(firstLegacyModel.performanceModel, firstTraceParsedData);

    const secondTraceFileName = 'slow-interaction-keydown.json.gz';
    const secondLegacyModel = await traceModelFromTraceFile(secondTraceFileName);
    const secondTraceParsedData = await loadModelDataFromTraceFile(secondTraceFileName);
    historyManager.addRecording(secondLegacyModel.performanceModel, secondTraceParsedData);

    // Make sure the correct model tuples (legacy and new engine) are returned when
    // using the history manager to navigate between trace files..
    const previousRecording = historyManager.navigate(1);
    assert.strictEqual(previousRecording?.legacyModel, firstLegacyModel.performanceModel);
    assert.strictEqual(previousRecording?.traceParseData, firstTraceParsedData);

    const nextRecording = historyManager.navigate(-1);
    assert.strictEqual(nextRecording?.legacyModel, secondLegacyModel.performanceModel);
    assert.strictEqual(nextRecording?.traceParseData, secondTraceParsedData);
  });
});
