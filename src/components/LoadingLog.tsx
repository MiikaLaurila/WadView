interface Props {
    log: string[];
}
export const LoadingLog: React.FC<Props> = (props: Props) => {
    return (
        <div
            style={{
                border: '1px solid black',
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '400px',
                maxWidth: '600px',
                overflowY: 'scroll',
                marginLeft: 'auto',
                marginRight: 'auto',
                paddingLeft: '8px',
                display: 'flex',
                flexDirection: 'column-reverse',
            }}
        >
            {props.log.length > 0
                ? (
                    [...props.log].reverse().map((e, idx) => {
                        return (
                            <p style={{ margin: 0, padding: 0 }} key={`${e}_${idx}`}>
                                {e}
                            </p>
                        );
                    })
                )
                : (
                    <p>Waiting for messages...</p>
                )}
        </div>
    );
};
