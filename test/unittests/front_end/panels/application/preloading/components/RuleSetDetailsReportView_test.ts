// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Protocol from '../../../../../../../front_end/generated/protocol.js';
import * as PreloadingComponents from '../../../../../../../front_end/panels/application/preloading/components/components.js';
import * as Coordinator from '../../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import * as ReportView from '../../../../../../../front_end/ui/components/report_view/report_view.js';
import {
  assertShadowRoot,
  getCleanTextContentFromElements,
  getElementWithinComponent,
  renderElementIntoDOM,
} from '../../../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../../../helpers/EnvironmentHelpers.js';

const {assert} = chai;

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();

const zip2 = <T, S>(xs: T[], ys: S[]): [T, S][] => {
  assert.strictEqual(xs.length, ys.length);

  return Array.from(xs.map((_, i) => [xs[i], ys[i]]));
};

async function renderRuleSetDetailsReportView(
    data: PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportViewData): Promise<HTMLElement> {
  const component = new PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportView();
  component.data = data;
  renderElementIntoDOM(component);
  assertShadowRoot(component.shadowRoot);
  await coordinator.done();

  return component;
}

describeWithEnvironment('RuleSetDetailsReportView', async () => {
  it('renders nothing if not selected', async () => {
    const data = null;

    const component = await renderRuleSetDetailsReportView(data);
    assertShadowRoot(component.shadowRoot);

    assert.strictEqual(component.shadowRoot.textContent, '');
  });

  it('renders rule set', async () => {
    const data: Protocol.Preload.RuleSet = {
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch": [
    {
      "source": "list",
      "urls": ["/subresource.js"]
    }
  ]
}
`,
    };

    const component = await renderRuleSetDetailsReportView(data);
    const report = getElementWithinComponent(component, 'devtools-report', ReportView.ReportView.Report);

    const keys = getCleanTextContentFromElements(report, 'devtools-report-key');
    const values = getCleanTextContentFromElements(report, 'devtools-report-value');
    assert.deepEqual(zip2(keys, values), [
      ['Validity', 'Valid'],
      ['Source', '{"prefetch":[{"source":"list","urls":["/subresource.js"]}]}'],
    ]);
  });

  it('renders invalid rule set', async () => {
    const data: Protocol.Preload.RuleSet = {
      id: 'ruleSetId:1' as Protocol.Preload.RuleSetId,
      loaderId: 'loaderId:1' as Protocol.Network.LoaderId,
      sourceText: `
{
  "prefetch": [
    {
      "source": "list",
`,
    };

    const component = await renderRuleSetDetailsReportView(data);
    const report = getElementWithinComponent(component, 'devtools-report', ReportView.ReportView.Report);

    const keys = getCleanTextContentFromElements(report, 'devtools-report-key');
    const values = getCleanTextContentFromElements(report, 'devtools-report-value');
    assert.deepEqual(zip2(keys, values), [
      // Currently, all rule sets that appear in DevTools are valid.
      // TODO(https://crbug.com/1384419): Add property `validity` to the CDP.
      ['Validity', 'Valid'],
      ['Source', '{"prefetch": [{"source": "list",'],
    ]);
  });
});
