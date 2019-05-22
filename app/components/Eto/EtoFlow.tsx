import * as React from "react";
import { EtoPanel } from "./EtoPanel";
import counterpart from "counterpart";

const flow = [
  { title: "eto_apply.flow.apply", content: "eto_apply.flow.apply_content" },
  { title: "eto_apply.flow.lock", content: "eto_apply.flow.lock_content" },
  { title: "eto_apply.flow.draw", content: "eto_apply.flow.draw_content" },
  { title: "eto_apply.flow.buy", content: "eto_apply.flow.buy_content" }
];

const flowCenter = new Array(7).fill(1).map((_, step) => ({
  title: `eto_apply.center.flow.step_${step + 1}`,
  content: `eto_apply.center.flow.step_content_${step + 1}`
}));

export const EtoFlow = ({ center = false }) => (
  <EtoPanel>
    <h4>{counterpart.translate("eto_apply.flow.title")}</h4>
    <ul className="eto-flow">
      {(center ? flowCenter : flow).map((step, index) => (
        <li key={index}>
          <h4>{counterpart.translate(step.title)}</h4>
          <p>{counterpart.translate(step.content)}</p>
        </li>
      ))}
    </ul>
  </EtoPanel>
);
