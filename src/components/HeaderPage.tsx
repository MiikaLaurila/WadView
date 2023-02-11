import { type WadHeader } from '../interfaces/wad/WadHeader';

interface Props {
    header: WadHeader;
}

export const HeaderPage: React.FC<Props> = (props: Props) => {
    const { header } = props;
    console.log(header);
    return null;
};
