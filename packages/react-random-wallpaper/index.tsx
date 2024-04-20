import * as React from "react";

const PackageName = "@bond-wm/random-wallpaper";

/** A random wallpaper for bond-wm from unsplash.com */
export function RandomWallpaper() {
  
  return (<div  style={{  
  position: "absolute",   
  height: "100%",width: "100%", 
  backgroundImage: "url('https://source.unsplash.com/random')", 
  backgroundSize: "cover", 
  backgroundPosition: "center" }}></div>);
}
