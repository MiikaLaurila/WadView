import { mus2midi } from "mus2midi";
import type { WadMusic } from "wadview-lib";
import { getMusic } from "../..";
import { Timidity } from "../../lib/timidity/timidity";
import { createModule, disposeModules } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";

const containerId = "music-window-container";
const musicListContainerClass = "music-window-music-list-container";
const musicListRowContainerClass = "music-window-music-list-row-container";
const musicListRowNameClass = "music-window-music-list-row-name";
const musicListRowInfoClass = "music-window-music-list-row-info";
const musicListRowPlayingClass = "music-window-music-list-row-playing";
const musicControlsContainerClass = "music-window-player-controls";
const musicControlsSliderContainerClass =
	"music-window-player-controls-sliders";
const musicControlsMaximizeButtonClass =
	"music-window-player-controls-maximize";
const sliderContainerClass = "music-slider-container";

let musicList: WadMusic[] = [];
let midiPlayer = new Timidity(
	() => console.log("MIDI player ready to load"),
	"./eawpats",
);
let selectedMusic: WadMusic | null = null;
let rootContainer: HTMLDivElement | null = null;
let selectedMusicDiv: HTMLDivElement | null = null;
let playingMusicDiv: HTMLDivElement | null = null;
let playIconDiv: HTMLDivElement | null = null;
let normalMusicPlayer: HTMLAudioElement | null = null;
let volume = 0.5;
let updateTimeEventListener: EventListener | null = null;
let endSongEventListener: EventListener | null = null;
let currentPlayer: "midi" | "normal" = "midi";
export let musicVisibilityState: "off" | "on" | "minimized" = "off";

const reinitMidiPlayer = async () => {
	if (!midiPlayer.destroyed) {
		midiPlayer.destroy();
	}
	return new Promise<void>((resolve, reject) => {
		try {
			midiPlayer = new Timidity(() => {
				console.log("MIDI player ready to load");
				midiPlayer.volume = volume;
				resolve();
			}, "./eawpats");
		} catch (e) {
			console.error(e);
			reject();
		}
	});
};

const disposeMusic = () => {
	if (!midiPlayer.destroyed) {
		midiPlayer.destroy();
	}
	musicVisibilityState = "off";
	musicList = [];
	selectedMusic = null;
	selectedMusicDiv = null;
	playingMusicDiv = null;
	rootContainer = null;
	playIconDiv = null;
	if (updateTimeEventListener) {
		document.removeEventListener("timeupdate", updateTimeEventListener);
		updateTimeEventListener = null;
	}
	if (endSongEventListener) {
		document.removeEventListener("ended", endSongEventListener);
		endSongEventListener = null;
	}
	volume = 0.5;
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
	rootContainer?.parentElement?.parentElement?.removeChild(
		rootContainer.parentElement,
	);
	disposeMusic();
};

const getNormalMusicPlayer = (music: WadMusic) => {
	normalMusicPlayer = document.createElement("audio");
	normalMusicPlayer.controls = false;
	const audioSource = document.createElement("source");
	const url = URL.createObjectURL(new Blob([Buffer.from(music.data)]));
	audioSource.type = music.type.mime;
	audioSource.src = url;
	normalMusicPlayer.appendChild(audioSource);
	if (updateTimeEventListener) {
		normalMusicPlayer.addEventListener("timeupdate", updateTimeEventListener);
	}
	if (endSongEventListener) {
		normalMusicPlayer.addEventListener("ended", endSongEventListener);
	}
	document.body.appendChild(normalMusicPlayer);
	return normalMusicPlayer;
};

const disposeNormalMusicPlayer = () => {
	if (normalMusicPlayer) {
		normalMusicPlayer.parentElement?.removeChild(normalMusicPlayer);
		normalMusicPlayer = null;
	}
};

const getMusicListing = (musicList: WadMusic[]) => {
	const musicListingContainer = document.createElement("div");
	musicListingContainer.className = musicListContainerClass;

	for (const music of musicList) {
		const musicRow = document.createElement("div");
		musicRow.className = musicListRowContainerClass;
		musicRow.id = music.name;

		const textContainer = document.createElement("div");

		const nameRow = document.createElement("div");
		nameRow.className = musicListRowNameClass;
		nameRow.innerText = music.name;
		textContainer.appendChild(nameRow);

		const infoRow = document.createElement("div");
		infoRow.className = musicListRowInfoClass;

		const extInfo = document.createElement("p");
		const extInfoHeader = document.createElement("span");
		extInfoHeader.innerText = "Extension: ";
		extInfo.appendChild(extInfoHeader);
		const extInfoText = document.createElement("span");
		extInfoText.innerText = music.type.ext;
		extInfo.appendChild(extInfoText);
		infoRow.appendChild(extInfo);

		const mimeInfo = document.createElement("p");
		const mimeInfoHeader = document.createElement("span");
		mimeInfoHeader.innerText = "Mime: ";
		mimeInfo.appendChild(mimeInfoHeader);
		const mimeInfoText = document.createElement("span");
		mimeInfoText.innerText = music.type.mime;
		mimeInfo.appendChild(mimeInfoText);
		infoRow.appendChild(mimeInfo);

		textContainer.appendChild(infoRow);
		musicRow.appendChild(textContainer);

		const playContainer = document.createElement("div");
		playContainer.className = musicListRowPlayingClass;
		playContainer.innerText = "▶️";
		musicRow.appendChild(playContainer);

		musicRow.addEventListener("click", (evt) => {
			const potentialMusic = musicList.find(
				(e) => e.name === (evt.currentTarget as HTMLDivElement).id,
			);
			if (potentialMusic) selectSong(potentialMusic);
		});

		musicRow.addEventListener("dblclick", () => {
			if (selectedMusic) playSong(selectedMusic);
		});

		musicListingContainer.appendChild(musicRow);
	}

	return musicListingContainer;
};

const setPlaying = (musicName: string) => {
	const musicDiv = document.getElementById(musicName);
	if (musicDiv) {
		if (playingMusicDiv) {
			playingMusicDiv.classList.remove("playing");
		}
		musicDiv.classList.add("playing");
		const playingDiv = Array.from(
			musicDiv.getElementsByClassName("music-window-music-list-row-playing"),
		);
		if (playingDiv.length > 0) {
			(playingDiv[0] as HTMLDivElement).innerText = "▶️";
		}
		playingMusicDiv = musicDiv as HTMLDivElement;
		if (playIconDiv) {
			playIconDiv.innerHTML = `<span>Now Playing:</span> ${musicName}`;
		}
	}
};

const setPaused = () => {
	if (playingMusicDiv) {
		const playingDiv = Array.from(
			playingMusicDiv.getElementsByClassName(
				"music-window-music-list-row-playing",
			),
		);
		if (playingDiv.length > 0) {
			(playingDiv[0] as HTMLDivElement).innerText = "⏸️";
		}
	}
	if (playIconDiv) {
		playIconDiv.innerHTML = `<span>Paused:</span> ${playingMusicDiv?.id}`;
	}
};

const playMidi = async (midi: Uint8Array, music: WadMusic) => {
	if (midiPlayer.playing && music.name === playingMusicDiv?.id) {
		return;
	}
	if (midiPlayer.paused && music.name === playingMusicDiv?.id) {
		midiPlayer.play();
		setPlaying(playingMusicDiv.id);
	} else {
		await reinitMidiPlayer();
		await midiPlayer.load(midi);
		midiPlayer.play();
		setPlaying(music.name);
	}
};

const playNormalSong = (musicToPlay: WadMusic) => {
	const player = getNormalMusicPlayer(musicToPlay);
	player.volume = volume;
	player.play();
	setPlaying(musicToPlay.name);
};

const playSong = async (musicToPlay: WadMusic) => {
	disposeNormalMusicPlayer();
	await reinitMidiPlayer();
	if (musicToPlay.type.ext === "mus") {
		const mid = mus2midi(Buffer.from(musicToPlay.data.buffer));
		currentPlayer = "midi";
		playMidi(mid, musicToPlay);
	} else if (musicToPlay.type.ext === "mid") {
		currentPlayer = "midi";
		playMidi(musicToPlay.data, musicToPlay);
	} else if (musicToPlay.type.ext === "ogg" || musicToPlay.type.ext === "mp3") {
		currentPlayer = "normal";
		playNormalSong(musicToPlay);
	} else {
		console.log("Cannot play music:", musicToPlay);
	}
	selectSong(musicToPlay);
};

const selectSong = (music: WadMusic) => {
	selectedMusic = music;
	if (selectedMusicDiv) {
		selectedMusicDiv.classList.remove("selected");
	}
	const potentialNewSelMusicDiv = document.getElementById(music.name);
	if (potentialNewSelMusicDiv) {
		selectedMusicDiv = potentialNewSelMusicDiv as HTMLDivElement;
		selectedMusicDiv.classList.add("selected");
	}
};

const pauseMidi = async () => {
	if (!midiPlayer.paused) {
		await midiPlayer.pause();
	}
	setPaused();
};

const pauseNormalSong = () => {
	if (normalMusicPlayer) {
		normalMusicPlayer.pause();
		setPaused();
	}
};

const pauseSong = () => {
	const playingMusic = musicList.find((m) => m.name === playingMusicDiv?.id);
	if (playingMusic) {
		if (playingMusic.type.ext === "mus" || playingMusic.type.ext === "mid") {
			pauseMidi();
		} else if (
			playingMusic.type.ext === "ogg" ||
			playingMusic.type.ext === "mp3"
		) {
			pauseNormalSong();
		}
	}
};

const nextSong = () => {
	const currentMus = musicList.findIndex((m) => m.name === playingMusicDiv?.id);
	if (currentMus !== undefined && musicList.length > currentMus + 1) {
		const musicToPlay = musicList[currentMus + 1];
		playSong(musicToPlay);
	} else {
		pauseSong();
	}
};

const prevSong = () => {
	const currentMus = musicList.findIndex((m) => m.name === playingMusicDiv?.id);
	if (currentMus !== undefined && currentMus > 0 && musicList.length) {
		const musicToPlay = musicList[currentMus - 1];
		playSong(musicToPlay);
	} else {
		pauseSong();
	}
};

export const initMusicModule = () => {
	if (musicVisibilityState === "on") {
		return;
	}
	setTopBarPageName("MUSIC");
	const tempMusic = getMusic();
	if (!tempMusic) return;
	musicList = tempMusic;

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
	baseModule.appendChild(rootContainer);

	rootContainer.appendChild(getMusicListing(musicList));

	const controlsContainer = document.createElement("div");
	controlsContainer.className = musicControlsContainerClass;

	playIconDiv = document.createElement("div");
	playIconDiv.innerText = "No music playing";
	controlsContainer.appendChild(playIconDiv);

	const buttonsContainer = document.createElement("div");

	const playButton = document.createElement("button");
	playButton.onclick = async () => {
		const musicToPlay = selectedMusic ?? musicList[0];
		playSong(musicToPlay);
	};
	playButton.innerText = "⏵︎";
	buttonsContainer.appendChild(playButton);

	const pauseButton = document.createElement("button");
	pauseButton.onclick = () => {
		pauseSong();
	};
	pauseButton.innerText = "⏸︎";
	buttonsContainer.appendChild(pauseButton);

	const prevButton = document.createElement("button");
	prevButton.onclick = () => {
		prevSong();
	};
	prevButton.innerText = "⏮︎";
	buttonsContainer.appendChild(prevButton);

	const nextButton = document.createElement("button");
	nextButton.onclick = () => {
		nextSong();
	};
	nextButton.innerText = "⏭︎";
	buttonsContainer.appendChild(nextButton);

	controlsContainer.appendChild(buttonsContainer);

	const sliderContainer = document.createElement("div");
	sliderContainer.className = musicControlsSliderContainerClass;

	const volumeSliderContainer = document.createElement("div");
	volumeSliderContainer.classList.add(sliderContainerClass);
	volumeSliderContainer.classList.add("volume");
	const volumeText = document.createElement("span");
	volumeText.innerText = "50%";
	volumeSliderContainer.appendChild(volumeText);
	const volumeSlider = document.createElement("input");
	volumeSlider.type = "range";
	volumeSlider.min = "0";
	volumeSlider.max = "100";
	volumeSlider.value = (midiPlayer.volume * 100).toString();
	volumeSlider.addEventListener("input", (evt: Event) => {
		const rawVolume = Number((evt.target as HTMLInputElement).value);
		const newVolume = rawVolume / 100;
		volume = newVolume;
		volumeText.innerText = `${rawVolume}%`;
		midiPlayer.volume = newVolume;
		if (normalMusicPlayer) {
			normalMusicPlayer.volume = newVolume;
		}
	});
	volumeSliderContainer.appendChild(volumeSlider);
	sliderContainer.appendChild(volumeSliderContainer);

	const seekerSliderContainer = document.createElement("div");
	seekerSliderContainer.classList.add(sliderContainerClass);
	seekerSliderContainer.classList.add("seeker");
	const seekerText = document.createElement("span");
	seekerText.innerText = "--:-- / --:--";
	seekerSliderContainer.appendChild(seekerText);
	const seekerSlider = document.createElement("input");
	seekerSlider.type = "range";
	seekerSlider.min = "0";
	seekerSlider.max = "0";
	seekerSlider.value = "0";

	const formatTime = (time: number): string => {
		if (time < 0 || !Number.isFinite(time)) {
			return "--:--";
		}
		const totalMinutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	};

	function updateTimeEvtListener(
		e: CustomEventInit<{ currentTime: number; maxTime: number }> | Event,
	) {
		let currentTime: number | null = null;
		let maxTime: number | null = null;
		if ((e as CustomEventInit).detail) {
			currentTime = (e as CustomEventInit).detail.currentTime as number;
			maxTime = (e as CustomEventInit).detail.maxTime as number;
			seekerSlider.max = Math.floor(maxTime).toString();
			seekerSlider.value = Math.round(currentTime).toString();
			seekerText.innerText = `${formatTime(currentTime)} / ${formatTime(maxTime)}`;
		} else {
			const evt = e as Event;
			if (evt.target) {
				currentTime = (evt.target as HTMLAudioElement).currentTime;
				maxTime = (evt.target as HTMLAudioElement).duration;
			}
		}
		if (currentTime !== null && maxTime !== null) {
			seekerSlider.max = Math.floor(maxTime).toString();
			seekerSlider.value = Math.round(currentTime).toString();
			seekerText.innerText = `${formatTime(currentTime)} / ${formatTime(maxTime)}`;
		}
	}
	updateTimeEventListener = updateTimeEvtListener;
	document.addEventListener("timeupdate", updateTimeEventListener);

	function endSongEvtListener() {
		nextSong();
	}
	endSongEventListener = endSongEvtListener;
	document.addEventListener("ended", endSongEventListener);

	seekerSlider.addEventListener("input", (evt) => {
		if (currentPlayer === "midi") {
			midiPlayer.seek(Number((evt.target as HTMLInputElement).value));
		} else if (currentPlayer === "normal" && normalMusicPlayer) {
			normalMusicPlayer.currentTime = Number(
				(evt.target as HTMLInputElement).value,
			);
		}
	});
	seekerSliderContainer.appendChild(seekerSlider);
	sliderContainer.appendChild(seekerSliderContainer);
	controlsContainer.appendChild(sliderContainer);

	const maximiseButton = document.createElement("button");
	maximiseButton.className = musicControlsMaximizeButtonClass;
	maximiseButton.innerText = "⏶︎";
	maximiseButton.addEventListener("click", () => {
		disposeModules();
		maximizeMusic();
	});
	controlsContainer.appendChild(maximiseButton);

	rootContainer.appendChild(controlsContainer);
};
