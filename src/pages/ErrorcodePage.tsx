

const ICEGATE_ERRORS = [
  { code: '000', desc: 'SUBMITTED JOB SUCCESSFULLY' },
  { code: '001', desc: 'MESSAGE TYPE CAN BE F/A ONLY' },
  { code: '002', desc: 'CONSOL NOT SUBMITTED – AMENDMENT CANNOT BE FILED' },
  { code: '003', desc: 'MASTER HAS ALREADY BEEN SUBMITTED, GO FOR AMENDMENT' },
  { code: '004', desc: 'CARN NO IS NULL' },
  { code: '005', desc: 'CARN NUMBER/AIRLINE CODE NOT REGISTERED' },
  { code: '006', desc: 'MASTER AIRWAY BILL NO IS NULL' },
  { code: '007', desc: 'MASTER NO. HAS WRONG AIRLINE CODE' },
  { code: '008', desc: 'MASTER NO. HAS WRONG CHECK DIGIT' },
  { code: '009', desc: 'MASTER NO. HAS WRONG AIRLINE CODE/CHECK DIGIT' },
  { code: '010', desc: 'MASTER NO. HAS SPECIAL CHARACTER' },
  { code: '011', desc: 'MASTER NO. HAS WRONG AIRLINE CODE/SP.CHAR.EXISTS' },
  { code: '012', desc: 'MASTER NO. HAS WRONG CHECK DIGIT/SP.CHAR.EXISTS' },
  { code: '013', desc: 'MASTER NO. HAS WRONG CHECK DIGIT/AIRLINE CD/SP.CHAR.EXISTS' },
  { code: '014', desc: 'PORT OF ORIGIN IS NULL' },
  { code: '015', desc: 'PORT OF ORIGIN NOT VALID IN CONSOL MASTER' },
  { code: '016', desc: 'PORT OF DESTINATION IS NULL' },
  { code: '017', desc: 'PORT OF DESTINATION NOT VALID IN CONSOL MASTER' },
  { code: '018', desc: 'TOTAL PACKAGE IN CONSOL MASTER CANNOT BE NULL OR ZERO/NEGATIVE' },
  { code: '019', desc: 'GROSS WEIGHT CANNOT BE NULL OR ZERO/NEGATIVE' },
  { code: '020', desc: 'ITEM DESCRIPTION CANNOT BE NULL' },
  { code: '021', desc: 'MESSAGE TYPE CAN BE F/A/D ONLY' },
  { code: '022', desc: 'HOUSE AIRWAY BILL NUMBER NULL' },
  { code: '023', desc: 'HOUSE CONTAINS SPECIAL CHARACTERS' },
  { code: '024', desc: 'PORT OF ORIGIN IS NULL IN HOUSE' },
  { code: '025', desc: 'PORT OF ORIGIN NOT VALID IN CONSOL HOUSE' },
  { code: '026', desc: 'PORT OF DESTINATION IS NULL IN HOUSE' },
  { code: '027', desc: 'PORT OF DESTINATION NOT VALID IN CONSOL HOUSE' },
  { code: '028', desc: 'TOTAL PACKAGES IS NULL/ZERO/NEGATIVE IN HOUSE' },
  { code: '029', desc: 'GROSS WEIGHT IS NULL/ZERO/NEGATIVE IN HOUSE' },
  { code: '030', desc: 'ITEM DESCRIPTION CANNOT BE NULL IN HOUSE' },
  { code: '031', desc: 'SUBMISSION MODE IS NOT VALID IN HOUSE' },
  { code: '032', desc: 'FOUND DUPLICATE HOUSE DETAIL IN HOUSE' },
  { code: '033', desc: 'NO OF PACKAGES AT CONSOL MASTER CANNOT BE MORE THAN CONSOL HOUSES' },
  { code: '034', desc: 'DIFF OF GROSS WT IS MORE/LESS 10% BETWEEN MASTER AND HOUSES LEVELS' },
  { code: '035', desc: 'HOUSE LEVEL DATA IS NOT THREE FOR THIS JOB' },
  { code: '036', desc: 'LATE SUBMISSION – AMENDMENT NO.— DATED — PUT FOR APPROVAL' },
  { code: '037', desc: 'MULTIPLE LINES IN IGM IS THERE – MODIFY THE JOB' },
  { code: '038', desc: 'HAWB DATE CANNOT BE NULL' },
  { code: '039', desc: 'HAWB DATE CANNOT BE NULL' },
];


export const ErrorcodePage: React.FC = () => {


    return (
        <div className="page-container" style={{ paddingTop: '72px', paddingBottom: '24px', maxWidth: '1400px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
            <div className="errorcode-page">
                <h1>ICEGATE Error Codes</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ICEGATE_ERRORS.map((error) => (
                            <tr key={error.code}>
                                <td>{error.code}</td>
                                <td>{error.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};