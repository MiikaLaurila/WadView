import type { WadMusic } from "wadview-lib";
import { getMusic } from "../..";
import { ModPlayer } from "../../lib/js-mod-player/player";
import { mus2midi } from "../../lib/mus2midi";
import { Timidity } from "../../lib/timidity/timidity";
import { createModule, disposeModules } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";

const containerId = "music-window-container";
const musicListContainerClass = "music-window-music-list-container";
const musicListRowContainerClass = "music-window-music-list-row-container";
const musicListRowNameClass = "music-window-music-list-row-name";
const musicListRowInfoClass = "music-window-music-list-row-info";
const musicListRowPlayingClass = "music-window-music-list-row-playing";
const musicWindowPlayingTextId = "music-window-playing-text";
const musicControlsContainerClass = "music-window-player-controls";
const musicControlsSliderContainerClass =
	"music-window-player-controls-sliders";
const musicControlsMaximizeButtonClass =
	"music-window-player-controls-maximize";
const sliderContainerClass = "music-slider-container";

type PlayerType = "midi" | "normal" | "mod";
let volume = 0.5;
let musicList: WadMusic[] = [];
let midiPlayer = new Timidity(() => {}, "./eawpats");
let modPlayer = new ModPlayer();
let normalMusicPlayer: HTMLAudioElement | null = null;
let selectedMusic: WadMusic | null = null;
let rootContainer: HTMLDivElement | null = null;
let selectedMusicDiv: HTMLDivElement | null = null;
let playingMusicDiv: HTMLDivElement | null = null;
let playingTextDiv: HTMLDivElement | null = null;
let currentPlayerType: PlayerType = "midi";

let timeUpdateEvtListener: ((e: Event) => void) | null = null;
let songEndedEvtListener: (() => void) | null = null;
export let musicVisibilityState: "off" | "on" | "minimized" = "off";

const reinitMidiPlayer = async () => {
	if (!midiPlayer.destroyed) midiPlayer.destroy();
	return new Promise<void>((resolve) => {
		midiPlayer = new Timidity(() => {
			midiPlayer.volume = volume;
			resolve();
		}, "./eawpats");
	});
};

const reinitModPlayer = () => {
	modPlayer.unload();
	modPlayer = new ModPlayer();
	modPlayer.setVolume(volume);
};

const disposeNormalMusicPlayer = () => {
	if (normalMusicPlayer) {
		if (timeUpdateEvtListener) {
			normalMusicPlayer.removeEventListener(
				"timeupdate",
				timeUpdateEvtListener,
			);
		}
		if (songEndedEvtListener) {
			normalMusicPlayer.removeEventListener("ended", songEndedEvtListener);
		}
		normalMusicPlayer.parentElement?.removeChild(normalMusicPlayer);
		normalMusicPlayer = null;
	}
};

const extToPlayerType = (ext: string): PlayerType | null => {
	if (ext === "mus" || ext === "mid") return "midi";
	if (ext === "mod") return "mod";
	if (ext === "ogg" || ext === "mp3" || ext === "wav") return "normal";
	return null;
};

const playerControls = {
	midi: {
		play: async (music: WadMusic, midi: Uint8Array) => {
			if (midiPlayer.paused && music.name === playingMusicDiv?.id) {
				midiPlayer.play();
				return;
			}
			await reinitMidiPlayer();
			await midiPlayer.load(midi);
			if (!midiPlayer.destroyed) midiPlayer.play();
			else {
				console.error("Failed to load midi");
			}
		},
		pause: () => midiPlayer.paused || midiPlayer.pause(),
		seek: (position: number) => midiPlayer.seek(position),
	},
	normal: {
		play: (music: WadMusic) => {
			disposeNormalMusicPlayer();
			normalMusicPlayer = document.createElement("audio");
			const audioSource = document.createElement("source");
			audioSource.src = URL.createObjectURL(
				new Blob([Buffer.from(music.data)]),
			);
			audioSource.type = music.type.mime;
			normalMusicPlayer.appendChild(audioSource);
			normalMusicPlayer.volume = volume;
			normalMusicPlayer.play();
			document.body.appendChild(normalMusicPlayer);
			if (timeUpdateEvtListener && songEndedEvtListener) {
				normalMusicPlayer.addEventListener("timeupdate", timeUpdateEvtListener);
				normalMusicPlayer.addEventListener("ended", songEndedEvtListener);
			}
		},
		pause: () => normalMusicPlayer?.pause(),
		seek: (position: number) => {
			if (normalMusicPlayer) normalMusicPlayer.currentTime = position;
		},
	},
	mod: {
		play: async (music: WadMusic) => {
			if (!modPlayer.playing && music.name === playingMusicDiv?.id) {
				modPlayer.resume();
				return;
			}
			reinitModPlayer();
			await modPlayer.loadBuffer(music.data.buffer, volume, true);
			modPlayer.play();
		},
		pause: () => modPlayer.stop(),
		seek: (position: number) => {
			// modPlayer.setRow(position, 0);
		},
	},
};

const setPlaying = (musicId: string, musicName?: string) => {
	if (playingMusicDiv) playingMusicDiv.classList.remove("playing");

	const musicDiv = document.getElementById(musicId);
	if (!musicDiv) return;

	musicDiv.classList.add("playing");
	playingMusicDiv = musicDiv as HTMLDivElement;

	const playingDiv = musicDiv.querySelector(`.${musicListRowPlayingClass}`);
	if (playingDiv) (playingDiv as HTMLDivElement).innerText = "▶️";

	if (playingTextDiv) {
		playingTextDiv.innerHTML = "";
		const nowPlaying = document.createElement("span");
		nowPlaying.innerText = "Now Playing: ";
		const nameSpan = document.createElement("span");
		let name = `${musicName} (${musicId})`;
		if (name.length > 40) name = `${name.substring(0, 40)}...`;
		nameSpan.innerText = name;
		playingTextDiv.appendChild(nowPlaying);
		playingTextDiv.appendChild(nameSpan);
	}
};

const setPaused = (musicId: string, musicName?: string) => {
	if (!playingMusicDiv) return;

	const playingDiv = playingMusicDiv.querySelector(
		`.${musicListRowPlayingClass}`,
	);
	if (playingDiv) (playingDiv as HTMLDivElement).innerText = "⏸️";

	if (playingTextDiv) {
		playingTextDiv.innerHTML = "";
		const nowPlaying = document.createElement("span");
		nowPlaying.innerText = "Paused: ";
		const nameSpan = document.createElement("span");
		let name = `${musicName} (${musicId})`;
		if (name.length > 40) name = `${name.substring(0, 40)}...`;
		nameSpan.innerText = name;
		playingTextDiv.appendChild(nowPlaying);
		playingTextDiv.appendChild(nameSpan);
	}
};

const selectSong = (music: WadMusic) => {
	selectedMusic = music;
	selectedMusicDiv?.classList.remove("selected");

	const musicDiv = document.getElementById(music.name);
	if (musicDiv) {
		selectedMusicDiv = musicDiv as HTMLDivElement;
		selectedMusicDiv.classList.add("selected");
	}
};

const playSong = async (musicToPlay: WadMusic) => {
	selectSong(musicToPlay);

	const { ext } = musicToPlay.type;
	const playerType = extToPlayerType(ext);
	if (!playerType) {
		console.log(`Can't play ${ext} files`);
		return;
	}
	currentPlayerType = playerType;

	let playData = musicToPlay.data;
	if (ext === "mus") {
		playData = mus2midi(Buffer.from(musicToPlay.data.buffer));
	}

	const playingMusic = musicList.find(
		(m) => playingMusicDiv && m.name === playingMusicDiv.id,
	);

	if (playingMusic) {
		const playingType = extToPlayerType(playingMusic.type.ext);
		if (playingType && playingType !== playerType) {
			playerControls[playingType].pause();
		}
	}

	await playerControls[currentPlayerType].play(musicToPlay, playData);
	setPlaying(musicToPlay.name, musicToPlay.inMap);
};

const pauseSong = () => {
	if (!playingMusicDiv) return;

	const music = musicList.find(
		(m) => playingMusicDiv && m.name === playingMusicDiv.id,
	);
	if (!music) return;

	const { ext } = music.type;
	const playerType = extToPlayerType(ext);
	if (!playerType) {
		return;
	}

	playerControls[playerType].pause();
	setPaused(music.name, music.inMap);
};

const navigateSong = (direction: 1 | -1) => {
	if (!playingMusicDiv) return;

	const currentIndex = musicList.findIndex(
		(m) => playingMusicDiv && m.name === playingMusicDiv.id,
	);
	if (currentIndex === -1) return;

	const newIndex = currentIndex + direction;
	if (musicList[newIndex]) {
		playSong(musicList[newIndex]);
	} else {
		pauseSong();
	}
};

const nextSong = () => {
	navigateSong(1);
};

const formatTime = (time: number): string => {
	if (time < 0 || !Number.isFinite(time)) return "--:--";
	const totalMinutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	return `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const handleTimeUpdate = (e: Event) => {
	const seekerSlider = document.querySelector(
		".seeker input[type='range']",
	) as HTMLInputElement;
	const seekerText = document.querySelector(".seeker span") as HTMLSpanElement;

	if (!seekerSlider || !seekerText) return;

	switch (currentPlayerType) {
		case "midi": {
			const midiEvent = e as CustomEvent<{
				currentTime: number;
				maxTime: number;
			}>;
			if (midiEvent.detail) {
				seekerSlider.max = Math.floor(midiEvent.detail.maxTime).toString();
				seekerSlider.value = Math.round(
					midiEvent.detail.currentTime,
				).toString();
				seekerText.innerText = `${formatTime(midiEvent.detail.currentTime)} / ${formatTime(midiEvent.detail.maxTime)}`;
			}
			break;
		}

		case "normal": {
			const audio = e.target as HTMLAudioElement;
			seekerSlider.max = Math.floor(audio.duration).toString();
			seekerSlider.value = Math.round(audio.currentTime).toString();
			seekerText.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
			break;
		}

		case "mod": {
			const modEvent = e as CustomEvent<{
				currentPos: number;
				maxPos: number;
				currentRow: number;
			}>;
			if (
				modEvent.detail &&
				modEvent.detail.maxPos !== undefined &&
				modEvent.detail.currentPos !== undefined &&
				modEvent.detail.currentRow !== undefined
			) {
				seekerSlider.max = modEvent.detail.maxPos.toString();
				seekerSlider.value = modEvent.detail.currentPos.toString();
				seekerText.innerText = `${modEvent.detail.currentPos} (${modEvent.detail.currentRow}) / ${modEvent.detail.maxPos}`;
			}
			break;
		}
	}
};

const createMusicRow = (music: WadMusic) => {
	const row = document.createElement("div");
	row.className = musicListRowContainerClass;
	row.id = music.name;

	const textContainer = document.createElement("div");

	const nameRow = document.createElement("div");
	nameRow.className = musicListRowNameClass;
	nameRow.textContent = `${music.inMap} (${music.name})`;

	const infoRow = document.createElement("div");
	infoRow.className = musicListRowInfoClass;
	infoRow.innerHTML = `
    <p><span>Extension:</span> ${music.type.ext}</p>
    <p><span>Mime:</span> ${music.type.mime}</p>
  `;

	textContainer.append(nameRow, infoRow);

	const playIcon = document.createElement("div");
	playIcon.className = musicListRowPlayingClass;
	playIcon.textContent = "▶️";

	row.append(textContainer, playIcon);

	row.addEventListener("click", () => selectSong(music));
	row.addEventListener("dblclick", () => playSong(music));

	return row;
};

const createMusicListing = () => {
	const container = document.createElement("div");
	container.className = musicListContainerClass;

	const uniqueMusics = [...new Map(musicList.map((m) => [m.name, m])).values()];
	for (const music of uniqueMusics) {
		container.appendChild(createMusicRow(music));
	}

	return container;
};

const createVolumeSlider = () => {
	const container = document.createElement("div");
	container.className = `${sliderContainerClass} volume`;

	const volumeText = document.createElement("span");
	volumeText.textContent = `${volume * 100}%`;

	const slider = document.createElement("input");
	slider.type = "range";
	slider.min = "0";
	slider.max = "100";
	slider.value = (volume * 100).toString();

	slider.addEventListener("input", (e) => {
		const rawVolume = Number((e.target as HTMLInputElement).value);
		volume = rawVolume / 100;
		volumeText.textContent = `${rawVolume}%`;
		midiPlayer.volume = volume;
		if (normalMusicPlayer) normalMusicPlayer.volume = volume;
		modPlayer.setVolume(volume);
	});

	container.append(volumeText, slider);
	return container;
};

const createSeekerSlider = () => {
	const container = document.createElement("div");
	container.className = `${sliderContainerClass} seeker`;

	const timeText = document.createElement("span");
	timeText.textContent = "--:-- / --:--";

	const slider = document.createElement("input");
	slider.type = "range";
	slider.min = "0";
	slider.max = "0";
	slider.value = "0";

	slider.addEventListener("input", (e) => {
		const position = Number((e.target as HTMLInputElement).value);
		playerControls[currentPlayerType].seek(position);
	});

	timeUpdateEvtListener = handleTimeUpdate.bind(this);
	songEndedEvtListener = nextSong.bind(this);

	document.addEventListener("timeupdate", timeUpdateEvtListener);
	document.addEventListener("ended", songEndedEvtListener);

	container.append(timeText, slider);
	return container;
};

const createPlayerControls = () => {
	const container = document.createElement("div");
	container.className = musicControlsContainerClass;

	playingTextDiv = document.createElement("div");
	playingTextDiv.id = musicWindowPlayingTextId;
	playingTextDiv.textContent = "No music playing";
	container.appendChild(playingTextDiv);

	const buttons = [
		{ label: "⏵︎", action: () => playSong(selectedMusic || musicList[0]) },
		{ label: "⏸︎", action: pauseSong },
		{ label: "⏮︎", action: () => navigateSong(-1) },
		{ label: "⏭︎", action: () => navigateSong(1) },
	];

	const buttonContainer = document.createElement("div");
	for (const btn of buttons) {
		const button = document.createElement("button");
		button.textContent = btn.label;
		button.addEventListener("click", btn.action);
		buttonContainer.appendChild(button);
	}

	container.appendChild(buttonContainer);

	const sliders = document.createElement("div");
	sliders.className = musicControlsSliderContainerClass;
	sliders.append(createVolumeSlider(), createSeekerSlider());
	container.appendChild(sliders);

	const maxButton = document.createElement("button");
	maxButton.className = musicControlsMaximizeButtonClass;
	maxButton.textContent = "⏶︎";
	maxButton.addEventListener("click", () => {
		disposeModules();
		maximizeMusic();
	});

	container.appendChild(maxButton);
	return container;
};

export const minimizeMusic = () => {
	musicVisibilityState = "minimized";
	rootContainer?.classList.add("minimized");
};

export const maximizeMusic = () => {
	musicVisibilityState = "on";
	rootContainer?.classList.remove("minimized");
};

export const closeMusic = () => {
	rootContainer?.parentElement?.remove();
	disposeMusic();
};

const disposeMusic = () => {
	if (!midiPlayer.destroyed) midiPlayer.destroy();
	modPlayer.unload();
	disposeNormalMusicPlayer();

	document.removeEventListener("timeupdate", handleTimeUpdate);
	document.removeEventListener("ended", () => navigateSong(1));

	musicVisibilityState = "off";
	musicList = [];
	selectedMusic = null;
	rootContainer = null;
	selectedMusicDiv = null;
	playingMusicDiv = null;
	playingTextDiv = null;
	volume = 0.5;
};

export const initMusicModule = () => {
	if (musicVisibilityState === "on") return;
	setTopBarPageName("MUSIC");

	const tempMusic = getMusic();
	if (!tempMusic) return;

	musicList = tempMusic.sort((a, b) => a.inMap.localeCompare(b.inMap));

	if (musicVisibilityState === "minimized") {
		disposeModules();
		maximizeMusic();
		return;
	}

	musicVisibilityState = "on";
	const baseModule = createModule("music");

	rootContainer = document.createElement("div");
	rootContainer.id = containerId;
	rootContainer.classList.add("music-container");

	rootContainer.appendChild(createMusicListing());
	rootContainer.appendChild(createPlayerControls());

	baseModule.appendChild(rootContainer);
};
