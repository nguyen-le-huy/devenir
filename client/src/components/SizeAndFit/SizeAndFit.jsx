import styles from "./SizeAndFit.module.css";
import { useLenisControl } from "../../hooks/useLenisControl";

const SizeAndFit = ({ isOpen, onClose }) => {
    // Lock scroll khi modal mở using useLenisControl instead of useScrollLock
    useLenisControl(isOpen);

    return (
        <>
            <div
                className={styles.backdrop}
                onClick={onClose}
                data-lenis-prevent
            ></div>
            <div className={styles.sizeAndFit} data-lenis-prevent>
                <div className={styles.header}>
                    <span>Size & Fit</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        onClick={onClose}
                        style={{ cursor: 'pointer' }}
                    >
                        <path d="M6.36875 7.10625L0.904167 12.5708C0.806944 12.6681 0.6875 12.7201 0.545833 12.7271C0.404166 12.734 0.277778 12.6819 0.166667 12.5708C0.0555554 12.4597 0 12.3368 0 12.2021C0 12.0674 0.0555554 11.9444 0.166667 11.8333L5.63125 6.36875L0.166667 0.904167C0.0694443 0.806944 0.0173609 0.6875 0.0104164 0.545833C0.00347196 0.404166 0.0555554 0.277778 0.166667 0.166667C0.277778 0.0555554 0.400694 0 0.535417 0C0.670139 0 0.793056 0.0555554 0.904167 0.166667L6.36875 5.63125L11.8333 0.166667C11.9306 0.0694443 12.0503 0.0173609 12.1927 0.0104164C12.3337 0.00347196 12.4597 0.0555554 12.5708 0.166667C12.6819 0.277778 12.7375 0.400694 12.7375 0.535417C12.7375 0.670139 12.6819 0.793056 12.5708 0.904167L7.10625 6.36875L12.5708 11.8333C12.6681 11.9306 12.7201 12.0503 12.7271 12.1927C12.734 12.3337 12.6819 12.4597 12.5708 12.5708C12.4597 12.6819 12.3368 12.7375 12.2021 12.7375C12.0674 12.7375 11.9444 12.6819 11.8333 12.5708L6.36875 7.10625Z" fill="#0E0E0E" />
                    </svg>
                </div>
                <div className={styles.content} data-lenis-prevent>
                    <p className={styles.title}>Use the measurements below to find your size.</p>
                    <div className={styles.sizeTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Size</th>
                                    <th>CN</th>
                                    <th>Measurements</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>XXXS</td>
                                    <td>175/76A</td>
                                    <td>
                                        Chest 74cm<br />
                                        Waist 59cm<br />
                                        Hip 73cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>XXS</td>
                                    <td>175/80A</td>
                                    <td>
                                        Chest 80cm<br />
                                        Waist 65cm<br />
                                        Hip 79cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>XS</td>
                                    <td>180/88A</td>
                                    <td>
                                        Chest 86cm<br />
                                        Waist 71cm<br />
                                        Hip 85cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>S</td>
                                    <td>180/92A</td>
                                    <td>
                                        Chest 92cm<br />
                                        Waist 77cm<br />
                                        Hip 91cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>M</td>
                                    <td>180/96A</td>
                                    <td>
                                        Chest 98cm<br />
                                        Waist 83cm<br />
                                        Hip 97cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>L</td>
                                    <td>180/104A</td>
                                    <td>
                                        Chest 104cm<br />
                                        Waist 89cm<br />
                                        Hip 103cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>XL</td>
                                    <td>180/108A</td>
                                    <td>
                                        Chest 110cm<br />
                                        Waist 95cm<br />
                                        Hip 109cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>XXL</td>
                                    <td>185/116A</td>
                                    <td>
                                        Chest 116cm<br />
                                        Waist 101cm<br />
                                        Hip 115cm
                                    </td>
                                </tr>
                                <tr>
                                    <td>XXXL</td>
                                    <td>185/120A</td>
                                    <td>
                                        Chest 122cm<br />
                                        Waist 107cm<br />
                                        Hip 121cm
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SizeAndFit;
