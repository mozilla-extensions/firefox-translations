import React from "react";
import { generate } from "@ant-design/colors";

const baseColors = [
  {
    name: "Rose Red / Error, Danger",
    hex: "FF033E"
  },
  {
    name: "Gold",
    hex: "FFD700"
  },
  {
    name: "Violet",
    hex: "8F00FF"
  },
  {
    name: "Emerald Green / Success",
    hex: "50C878"
  },
  {
    name: "Bright Orange / Warning",
    hex: "FFA500"
  },
  {
    name: "Teal",
    hex: "30D5C8"
  },
  {
    name: "Royal Blue / Information",
    hex: "4169E1"
  }
];

const generatedColors = baseColors.map((hue) => {
  return {
    name: hue.name,
    colors: generate(hue.hex)
  };
});

const swatches = generatedColors.map((list) => (
  <div key={generatedColors.indexOf(list)}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginLeft: 20
    }}
  >
    <div key={Math.random()}>
      {list.colors.map((color, i) => (
        <div
          key={Math.random()}
          className={"Swatch"}
          style={{
            width: "240px",
            height: "30px",
            background: color,
            lineHeight: "30px",
            fontSize: "12px"
          }}
        >
          <span>
            {color +
              " - " +
              (i + 1) +
              ((i) => {
                switch (i) {
                  case 6:
                    return " / base";
                  case 7:
                    return " / active";
                  case 3:
                    return " / disabled";
                  case 5:
                    return " / hover";
                  case 1:
                    return " / disabled text";
                  default:
                    return "";
                }
              })(i + 1)}
          </span>
        </div>
      ))}
    </div>
    <div>{list.name}</div>
  </div>
));


const Palette = () => {


  return (
    <div className="Palette">
      <div className="swatches" style={{ display: "flex" }}>
        {swatches}
      </div>
    </div>
  )
}


export default Palette;
