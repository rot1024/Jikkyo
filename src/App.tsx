/** @jsx jsx */
import React, { Fragment, useState, useCallback } from "react";
import { css, jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";
import { Global } from "@emotion/core";
import useFileInput from "use-file-input";

import globalStyles from "./styles";
import Video, { EventType } from "./components/Video";
import Controller from "./components/Controller";

const App: React.FC = () => {
  const [src, setSrc] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>();
  const [seekTime, setSeekTime] = useState<number>();
  const [duration, setDuration] = useState<number>();
  const [controllerHidden, setControllerHidden] = useState(false);
  const handleVideoClick = useCallback(() => setControllerHidden(p => !p), []);
  const handlePlayButtonClick = useCallback(() => setPlaying(p => !p), []);
  const handleVideoEvent = useCallback(
    (e: EventType, ct: number, d: number) => {
      if (e === "load" || e === "pause") {
        setPlaying(false);
      } else if (e === "play") {
        setPlaying(true);
      }
      setCurrentTime(ct);
      setDuration(d);
    },
    []
  );
  const handleOpen = useFileInput(
    files => {
      if (files.length === 0) return;
      const url = URL.createObjectURL(files[0]);
      setSrc(url);
    },
    { accept: "video/*", multiple: true }
  );

  return (
    <Fragment>
      <Global styles={globalStyles} />
      <Video
        src={src}
        currentTime={seekTime}
        playing={playing}
        onTimeUpdate={setCurrentTime}
        onEvent={handleVideoEvent}
        onClick={handleVideoClick}
      />
      <Controller
        hidden={controllerHidden}
        playing={playing}
        onPlayButtonClick={handlePlayButtonClick}
        onSeek={setSeekTime}
        onMenuButtonClick={handleOpen}
        currentTime={currentTime}
        duration={duration}
        css={css`
          position: fixed;
          bottom: 0;
        `}
      />
    </Fragment>
  );
};

export default hot(App);
