"""
Molecular utility functions for cannabis chemistry analysis
Integrates RDKit for advanced chemical informatics
"""

import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, rdMolDescriptors, AllChem
    from rdkit.Chem.Fingerprints import FingerprintMols
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

@dataclass
class MolecularProperties:
    """Container for molecular property data"""
    molecular_weight: float
    logp: float
    h_bond_donors: int
    h_bond_acceptors: int
    polar_surface_area: float
    rotatable_bonds: int
    aromatic_rings: int
    lipinski_violations: int
    
class CannabisChemistry:
    """Cannabis-specific chemistry analysis using RDKit"""
    
    # SMILES database for major cannabinoids
    CANNABINOIDS = {
        "THC": "CCCCCc1cc(c2c(c1)OC(C3C2C(=O)C=C3C)(C)C)O",
        "CBD": "CCCCCc1cc(c2c(c1)OC(C3C2C=C(CC3)C)(C)C)O", 
        "CBG": "CCCCCc1cc(c2c(c1)OC(C=C2C)(C)C)O",
        "CBC": "CCCCCc1cc2c(c(c1)O)OC(C(=C2)C)(C)C",
        "CBN": "CCCCCc1cc2c3c(c1)OC(C4C3C(=CC=C4C)O2)(C)C",
        "THCA": "CCCCCc1cc(c2c(c1)OC(C3C2C(=O)C=C3C(=O)O)(C)C)O",
        "CBDA": "CCCCCc1cc(c2c(c1)OC(C3C2C=C(CC3)C(=O)O)(C)C)O",
        "THCV": "CCCc1cc(c2c(c1)OC(C3C2C(=O)C=C3C)(C)C)O",
        "CBDV": "CCCc1cc(c2c(c1)OC(C3C2C=C(CC3)C)(C)C)O",
        "CBL": "CCCCCc1cc2c(c(c1)O)OC(C3C2=C(CC3C)C)(C)C"
    }
    
    # Common cannabis terpenes
    TERPENES = {
        "Myrcene": "CC(=CCCC(=CCCO)C)C",
        "Limonene": "CC(=C)C1CC=C(CC1)C", 
        "Pinene": "CC1=CCC2CC1C2(C)C",
        "Linalool": "CC(C)(C=C)CCC(C)(CCO)O",
        "Caryophyllene": "CC1=CCCC(=C)C2CCC(=C)C2CC1",
        "Humulene": "CC1=CCCC(CC=C(CCC=C1)C)C",
        "Terpinolene": "CC1=CCC(=C(C)C)CC1",
        "Ocimene": "CC(=CCCC(=CC)C)C",
        "Bisabolol": "CC(C)=CCCC(C)(O)CCC=C(C)C",
        "Camphene": "CC1(C)C2CCC1(C)C(=C)C2"
    }
    
    # Terpene effects database
    TERPENE_EFFECTS = {
        "Myrcene": {"sedating": 9, "muscle_relaxant": 8, "analgesic": 7, "anti_inflammatory": 6},
        "Limonene": {"mood_elevation": 9, "anti_anxiety": 8, "focus": 6, "antidepressant": 7},
        "Pinene": {"alertness": 9, "memory_retention": 8, "anti_inflammatory": 7, "bronchodilator": 6},
        "Linalool": {"calming": 9, "anti_anxiety": 8, "sleep_aid": 8, "anticonvulsant": 6},
        "Caryophyllene": {"anti_inflammatory": 9, "pain_relief": 8, "neuroprotective": 7, "gastroprotective": 6},
        "Humulene": {"appetite_suppressant": 8, "anti_inflammatory": 7, "antibacterial": 6, "anti_tumor": 5},
        "Terpinolene": {"sedating": 7, "antibacterial": 6, "antioxidant": 7, "antifungal": 5},
        "Ocimene": {"antiviral": 7, "antifungal": 6, "decongestant": 8, "antiseptic": 5}
    }
    
    def __init__(self):
        if not RDKIT_AVAILABLE:
            raise ImportError("RDKit is required for molecular analysis. Install with: pip install rdkit-pypi")
    
    def get_molecular_properties(self, smiles: str) -> Optional[MolecularProperties]:
        """Calculate molecular properties from SMILES notation"""
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            return None
        
        # Calculate basic properties
        mw = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        hbd = Descriptors.NumHDonors(mol)
        hba = Descriptors.NumHAcceptors(mol)
        tpsa = Descriptors.TPSA(mol)
        rotatable = Descriptors.NumRotatableBonds(mol)
        aromatic = Descriptors.NumAromaticRings(mol)
        
        # Calculate Lipinski violations
        violations = 0
        if mw > 500: violations += 1
        if logp > 5: violations += 1
        if hbd > 5: violations += 1
        if hba > 10: violations += 1
        
        return MolecularProperties(
            molecular_weight=mw,
            logp=logp,
            h_bond_donors=hbd,
            h_bond_acceptors=hba,
            polar_surface_area=tpsa,
            rotatable_bonds=rotatable,
            aromatic_rings=aromatic,
            lipinski_violations=violations
        )
    
    def calculate_cannabinoid_similarity(self, cannabinoid1: str, cannabinoid2: str) -> float:
        """Calculate structural similarity between two cannabinoids"""
        if cannabinoid1 not in self.CANNABINOIDS or cannabinoid2 not in self.CANNABINOIDS:
            return 0.0
        
        mol1 = Chem.MolFromSmiles(self.CANNABINOIDS[cannabinoid1])
        mol2 = Chem.MolFromSmiles(self.CANNABINOIDS[cannabinoid2])
        
        if not mol1 or not mol2:
            return 0.0
        
        # Calculate Morgan fingerprints
        fp1 = AllChem.GetMorganFingerprintAsBitVect(mol1, 2, nBits=1024)
        fp2 = AllChem.GetMorganFingerprintAsBitVect(mol2, 2, nBits=1024)
        
        # Calculate Tanimoto similarity
        return Chem.DataStructs.TanimotoSimilarity(fp1, fp2)
    
    def predict_solubility(self, smiles: str) -> Dict[str, float]:
        """Predict aqueous and lipid solubility"""
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            return {"aqueous": 0.0, "lipid": 0.0}
        
        logp = Descriptors.MolLogP(mol)
        
        # Simplified solubility predictions
        # LogS (aqueous solubility) ≈ -0.74 * LogP - 0.0066 * MW + 0.0034
        mw = Descriptors.MolWt(mol)
        log_s = -0.74 * logp - 0.0066 * mw + 0.0034
        aqueous_solubility = 10 ** log_s  # mg/L
        
        # Lipid solubility correlates with LogP
        lipid_solubility = 10 ** (logp - 2)  # Arbitrary units
        
        return {
            "aqueous": aqueous_solubility,
            "lipid": lipid_solubility,
            "log_s": log_s,
            "log_p": logp
        }
    
    def analyze_terpene_profile(self, terpene_percentages: Dict[str, float]) -> Dict[str, float]:
        """Analyze combined effects of a terpene profile"""
        combined_effects = {}
        
        for terpene, percentage in terpene_percentages.items():
            if terpene in self.TERPENE_EFFECTS:
                effects = self.TERPENE_EFFECTS[terpene]
                weight = percentage / 100.0
                
                for effect, strength in effects.items():
                    if effect not in combined_effects:
                        combined_effects[effect] = 0.0
                    combined_effects[effect] += strength * weight
        
        # Normalize effects
        if combined_effects:
            max_effect = max(combined_effects.values())
            if max_effect > 0:
                combined_effects = {k: v / max_effect * 10 for k, v in combined_effects.items()}
        
        return combined_effects
    
    def calculate_bioavailability_score(self, smiles: str) -> Dict[str, any]:
        """Calculate bioavailability indicators"""
        props = self.get_molecular_properties(smiles)
        if not props:
            return {"score": 0, "factors": []}
        
        score = 10
        factors = []
        
        # Lipinski's Rule of Five
        if props.lipinski_violations > 0:
            score -= props.lipinski_violations * 2
            factors.append(f"Lipinski violations: {props.lipinski_violations}")
        
        # Oral bioavailability factors
        if props.polar_surface_area > 140:
            score -= 2
            factors.append("High polar surface area (poor permeability)")
        
        if props.rotatable_bonds > 10:
            score -= 1
            factors.append("High rotatable bonds (poor bioavailability)")
        
        if props.logp < -2 or props.logp > 6:
            score -= 2
            factors.append("Poor lipophilicity balance")
        
        return {
            "score": max(0, score),
            "max_score": 10,
            "factors": factors,
            "lipinski_compliant": props.lipinski_violations == 0
        }
    
    def suggest_formulation_modifications(self, target_cannabinoid: str, 
                                        delivery_method: str) -> List[str]:
        """Suggest formulation modifications based on molecular properties"""
        if target_cannabinoid not in self.CANNABINOIDS:
            return ["Unknown cannabinoid"]
        
        props = self.get_molecular_properties(self.CANNABINOIDS[target_cannabinoid])
        if not props:
            return ["Unable to analyze molecular properties"]
        
        suggestions = []
        
        # Delivery method specific suggestions
        if delivery_method.lower() == "oral":
            if props.logp > 4:
                suggestions.append("Consider lipid-based formulation (high lipophilicity)")
                suggestions.append("Add surfactants to improve dissolution")
            
            if props.polar_surface_area > 100:
                suggestions.append("Consider permeation enhancers")
                suggestions.append("Evaluate prodrug approaches")
        
        elif delivery_method.lower() == "sublingual":
            if props.logp < 1:
                suggestions.append("Good sublingual absorption expected")
            else:
                suggestions.append("Consider co-solvents for sublingual delivery")
        
        elif delivery_method.lower() == "topical":
            suggestions.append("Consider penetration enhancers")
            if props.molecular_weight > 500:
                suggestions.append("High MW may limit skin penetration")
        
        # General formulation suggestions
        if props.h_bond_donors > 3:
            suggestions.append("High H-bond donors: consider pH optimization")
        
        if props.rotatable_bonds > 8:
            suggestions.append("High flexibility: may need stabilizing excipients")
        
        return suggestions if suggestions else ["No specific modifications recommended"]

# Utility functions
def create_cannabinoid_database() -> Dict[str, Dict]:
    """Create a comprehensive cannabinoid database with properties"""
    chemistry = CannabisChemistry()
    database = {}
    
    for name, smiles in chemistry.CANNABINOIDS.items():
        props = chemistry.get_molecular_properties(smiles)
        solubility = chemistry.predict_solubility(smiles)
        bioavailability = chemistry.calculate_bioavailability_score(smiles)
        
        database[name] = {
            "smiles": smiles,
            "molecular_weight": props.molecular_weight if props else 0,
            "logp": props.logp if props else 0,
            "aqueous_solubility": solubility["aqueous"],
            "lipid_solubility": solubility["lipid"],
            "bioavailability_score": bioavailability["score"],
            "lipinski_compliant": bioavailability["lipinski_compliant"]
        }
    
    return database

def analyze_extraction_efficiency(cannabinoid: str, solvent_logp: float) -> float:
    """Predict extraction efficiency based on molecular properties"""
    chemistry = CannabisChemistry()
    
    if cannabinoid not in chemistry.CANNABINOIDS:
        return 0.0
    
    props = chemistry.get_molecular_properties(chemistry.CANNABINOIDS[cannabinoid])
    if not props:
        return 0.0
    
    # Efficiency based on LogP matching
    logp_difference = abs(props.logp - solvent_logp)
    efficiency = max(0, 100 - (logp_difference * 15))
    
    return min(100, efficiency)