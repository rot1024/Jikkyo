/** @jsx jsx */
import React, { Fragment, useState, useCallback, useRef, useMemo } from "react";
import { css, jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";
import { Global } from "@emotion/core";
import { useLocalStorage } from "react-use";
import useFileInput from "use-file-input";
import { useHotkeys } from "react-hotkeys-hook";

import globalStyles from "./styles";
import loadComment, { Comment } from "./util/commentLoader";
import Video, { EventType, Methods } from "./components/Video";
import Controller from "./components/Controller";
import SettingPanel, {
  Settings,
  defaultSettings
} from "./components/SettingPanel";
import CommentArea, { CommentStyle } from "./components/CommentArea";

const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

const App: React.FC = () => {
  const videoRef = useRef<Methods>(null);
  const [src, setSrc] = useState<string>();
  const [[comments, commentDuration], setComments] = useState<
    [Comment[], number]
  >([[], 0]);
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [controllerHidden, setControllerHidden] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const handleVideoClick = useCallback(() => setControllerHidden(p => !p), []);
  const handlePlayButtonClick = useCallback(() => {
    if (videoRef.current && src) {
      setPlaying(videoRef.current.toggle());
    } else {
      setPlaying(p => !p);
    }
  }, [src]);
  const handleVideoEvent = useCallback(
    (e: EventType, ct: number, d: number) => {
      if (e === "load") {
        setPlaying(false);
        setCanPlay(false);
      } else if (e === "pause") {
        setPlaying(false);
      } else if (e === "play") {
        setPlaying(true);
      } else if (e === "canplay") {
        setCanPlay(true);
      }
      setCurrentTime(ct * 1000);
      setDuration(d * 1000);
    },
    []
  );
  const handleSeek = useCallback(
    (t: number, relative?: boolean) => {
      if (videoRef.current && src) {
        if (relative) {
          videoRef.current.seekRelative(t / 1000);
        } else {
          videoRef.current.seek(t / 1000);
        }
      } else {
        setCurrentTime(t2 => (relative ? t + t2 : t));
      }
    },
    [src]
  );
  const handleVideoOpen = useFileInput(
    files => {
      if (files.length === 0) return;
      const url = URL.createObjectURL(files[0]);
      setSrc(url);
      setPlaying(false);
      setCurrentTime(0);
    },
    { accept: !safari || ios ? "video/*" : "*", multiple: ios }
  );
  const handleCommentOpen = useFileInput(
    async files => {
      if (files.length === 0) return;
      const comments = await loadComment(files[0]);
      setComments(comments);
      if (!src) {
        setCanPlay(true);
      }
    },
    { accept: "application/xml" }
  );
  const handleMenuClose = useCallback(() => setMenuVisible(false), []);
  const [settings, setSettings] = useLocalStorage<Settings>(
    "jikkyo_settings",
    defaultSettings
  );
  const styles = useMemo<CommentStyle>(
    () => ({
      duration: settings.commentDuration,
      ueshitaDuration: settings.ueShitaCommentDuration,
      fontSize: settings.fontSize,
      rows: settings.rows,
      sizing: settings.sizeCalcMethod
      // fontFamily: settings.fontFamily,
      // fontWeight: settings.fontWeight,
      // lineHeight: settings.lineHeight,
      // bigSizeScale: settings.bigSizeScale,
      // smallSizeScale: settings.smallSizeScale,
    }),
    [
      settings.commentDuration,
      settings.fontSize,
      settings.rows,
      settings.sizeCalcMethod,
      settings.ueShitaCommentDuration
    ]
  );
  const thinning = useMemo<[number, number] | undefined>(() => {
    if (!settings.devision) return undefined;
    const denominator = parseInt(settings.devision, 10);
    if (isNaN(denominator) || denominator === 1) return undefined;
    const numeratorStr =
      denominator === 2
        ? settings.devision2 || 1
        : denominator === 3
        ? settings.devision3 || 1
        : denominator === 5
        ? settings.devision5 || 1
        : undefined;
    if (!numeratorStr) return undefined;
    const numerator = parseInt(numeratorStr, 10);
    if (isNaN(numerator)) return undefined;
    return [numerator, denominator];
  }, [
    settings.devision,
    settings.devision2,
    settings.devision3,
    settings.devision5
  ]);

  useHotkeys("space", handlePlayButtonClick);

  return (
    <Fragment>
      <Global styles={globalStyles} />
      <Video ref={videoRef} src={src} onEvent={handleVideoEvent} />
      <CommentArea
        comments={comments}
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        onSeek={handleSeek}
        onClick={handleVideoClick}
        onDoubleClick={handlePlayButtonClick}
        styles={styles}
        opacity={
          settings && settings.commentOpacity
            ? settings.commentOpacity / 100
            : undefined
        }
        opacityDanmaku={
          settings && settings.danmakuCommentOpacity
            ? settings.danmakuCommentOpacity / 100
            : undefined
        }
        thinning={thinning}
        timeCorrection={settings && settings.commentTimeCorrection}
      />
      <Controller
        hidden={controllerHidden}
        playing={playing}
        canPlay={canPlay}
        onPlayButtonClick={handlePlayButtonClick}
        onSeek={handleSeek}
        onVideoButtonClick={handleVideoOpen}
        onCommentButtonClick={handleCommentOpen}
        onMenuButtonClick={() => {
          if (!menuVisible) setMenuVisible(true);
        }}
        currentTime={currentTime}
        duration={Math.max(duration, commentDuration)}
        css={css`
          position: fixed;
          bottom: 0;
        `}
      />
      <SettingPanel
        shown={menuVisible}
        initialSettings={settings}
        onClose={handleMenuClose}
        onChange={setSettings}
      />
    </Fragment>
  );
};

export default hot(App);
