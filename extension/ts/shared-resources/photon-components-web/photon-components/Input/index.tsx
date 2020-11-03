import * as React from "react";
import classNames from "classnames";

import "./index.css";

export interface InputProps extends React.HTMLProps<HTMLInputElement> {
  placeholder?: string;
  type?: string;
  onChange?: (ev: any) => void; // eslint-disable-line no-unused-vars
  icon?: string;
  label?: string;
  warning?: boolean;
  error?: boolean;
}

export interface InputState {
  type: string;
  value: string;
}

export class Input extends React.Component<InputProps, InputState> {
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

    const isPassword = originalType == "password";
    const hasContent = value.length > 0;

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
      <label {...{ style, className: classNameWithMods("input") }}>
        {label && <span className="input__label">{label}</span>}
        <input
          className={classNameWithMods("input", "__field")}
          onChange={this.handleOnChange}
          {...{ type, value, ...props }}
        />
        {hasContent &&
          !isPassword &&
          !this.props.disabled &&
          this.renderClearButton()}
        {isPassword && this.renderPasswordVisibilityButton()}
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

  renderClearButton = () => (
    <span className="input__clear" onClick={this.handleClear}></span>
  );

  handleClear = () => {
    this.setState({
      value: "",
    });
  };

  renderPasswordVisibilityButton = () => (
    <span
      className="input__passwordVisibility"
      onClick={this.togglePasswordVisibility}
    >
      {this.state.type === "password" ? (
        <span className="input__passwordVisibility__hidden">&#x1F441;</span>
      ) : (
        <span className="input__passwordVisibility__revealed">&#x1F441;</span>
      )}
    </span>
  );

  togglePasswordVisibility = () =>
    this.setState({
      type: this.state.type === "password" ? "text" : "password",
    });
}

export default Input;
