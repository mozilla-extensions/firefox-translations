import * as React from "react";
import classNames from "classnames";

import "./index.css";

export interface TextAreaProps extends React.HTMLProps<HTMLTextAreaElement> {
  placeholder?: string;
  type?: string;
  onChange?: (ev: any) => void; // eslint-disable-line no-unused-vars
  icon?: string;
  label?: string;
  warning?: boolean;
  error?: boolean;
}

export interface TextAreaState {
  type: string;
  value: string;
}

export class TextArea extends React.Component<TextAreaProps, TextAreaState> {
  constructor(props) {
    super(props);
    const { type = "text", defaultValue = "", value = "" } = props;
    this.state = {
      type,
      value: defaultValue || value,
    };
  }

  render() {
    const {
      type: originalType,
      onChange: originalOnChange, // eslint-disable-line no-unused-vars
      icon = null,
      label = null,
      warning = false,
      error = false,
      ...props
    } = this.props;

    const { type = "text", value } = this.state;

    const style = {};
    if (icon) {
      style["--icon"] = `url(${icon})`;
    }

    const classNameWithMods = (pre = "", post = "") =>
      classNames(`${pre}${post}`, {
        [`${pre}--icon${post}`]: icon,
        [`${pre}--warning${post}`]: warning,
        [`${pre}--error${post}`]: error,
      });

    return (
      <label {...{ style, className: classNameWithMods("textarea") }}>
        {label && <span className="textarea__label">{label}</span>}
        <textarea onChange={this.handleOnChange} {...props}>
          {value}
        </textarea>
      </label>
    );
  }

  handleOnChange = ev => {
    const { onChange } = this.props;
    this.setState({
      value: ev.target.value,
    });
    if (onChange) {
      onChange(ev);
    }
  };
}

export default TextArea;
